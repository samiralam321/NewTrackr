from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.user import Profile, Follow
from app.models.post import Post
from app.models.notification import Notification
from app.schemas.user import ProfileResponse, ProfileUpdate, LeaderboardEntry, FollowToggleResponse

router = APIRouter(prefix="/users", tags=["Users & Profiles"])


@router.get("/profile/{user_id}", response_model=ProfileResponse)
async def get_user_profile(
    user_id: uuid.UUID,
    current_uid_str: Optional[str] = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    profile = await db.get(Profile, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # Counts
    followers_count = (await db.execute(select(func.count(Follow.follower_id)).where(Follow.following_id == user_id))).scalar() or 0
    following_count = (await db.execute(select(func.count(Follow.following_id)).where(Follow.follower_id == user_id))).scalar() or 0
    posts_count = (await db.execute(select(func.count(Post.id)).where(Post.user_id == user_id))).scalar() or 0

    is_following = False
    if current_uid_str:
        current_uid = uuid.UUID(current_uid_str)
        is_following_res = await db.execute(
            select(Follow).where(and_(Follow.follower_id == current_uid, Follow.following_id == user_id))
        )
        is_following = is_following_res.scalar() is not None

    resp = ProfileResponse.model_validate(profile)
    resp.followers_count = followers_count
    resp.following_count = following_count
    resp.posts_count = posts_count
    resp.is_following = is_following
    return resp


@router.patch("/profile", response_model=ProfileResponse)
async def update_profile(
    data: ProfileUpdate,
    current_uid_str: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    current_uid = uuid.UUID(current_uid_str)
    profile = await db.get(Profile, current_uid)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)

    await db.flush()
    await db.refresh(profile)
    return profile


@router.post("/follow/{target_user_id}", response_model=FollowToggleResponse)
async def toggle_follow(
    target_user_id: uuid.UUID,
    current_uid_str: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    current_uid = uuid.UUID(current_uid_str)
    if current_uid == target_user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    existing = await db.get(Follow, (current_uid, target_user_id))
    if existing:
        await db.delete(existing)
        return FollowToggleResponse(is_following=False, follower_id=current_uid, following_id=target_user_id)
    else:
        new_follow = Follow(follower_id=current_uid, following_id=target_user_id)
        db.add(new_follow)

        # Create notification for target user
        notif = Notification(
            id=uuid.uuid4(),
            user_id=target_user_id,
            actor_id=current_uid,
            type="follow"
        )
        db.add(notif)
        return FollowToggleResponse(is_following=True, follower_id=current_uid, following_id=target_user_id)


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Profile)
        .order_by(desc(Profile.consistency_score), desc(Profile.streak))
        .limit(limit)
    )
    result = await db.execute(stmt)
    profiles = result.scalars().all()

    entries = []
    for rank, p in enumerate(profiles, start=1):
        entries.append(
            LeaderboardEntry(
                id=p.id,
                full_name=p.full_name,
                avatar_url=p.avatar_url,
                college=p.college,
                consistency_score=p.consistency_score,
                streak=p.streak,
                badge_level=p.badge_level,
                rank=rank
            )
        )
    return entries
