from datetime import datetime, date, timezone
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.post import Post, Comment, Like, Bookmark
from app.models.user import Profile, Follow
from app.schemas.post import (
    PostCreate, 
    PostResponse, 
    CommentCreate, 
    CommentResponse, 
    ActionToggleResponse
)

router = APIRouter(prefix="/posts", tags=["Posts & Feeds"])


async def format_post_response(post: Post, current_uid: Optional[uuid.UUID], db: AsyncSession) -> PostResponse:
    # Likes count
    likes_count_res = await db.execute(select(func.count(Like.user_id)).where(Like.post_id == post.id))
    likes_count = likes_count_res.scalar() or 0

    # Comments count
    comments_count_res = await db.execute(select(func.count(Comment.id)).where(Comment.post_id == post.id))
    comments_count = comments_count_res.scalar() or 0

    user_has_liked = False
    user_has_bookmarked = False

    if current_uid:
        liked_res = await db.execute(select(Like).where(and_(Like.post_id == post.id, Like.user_id == current_uid)))
        user_has_liked = liked_res.scalar() is not None

        bookmarked_res = await db.execute(select(Bookmark).where(and_(Bookmark.post_id == post.id, Bookmark.user_id == current_uid)))
        user_has_bookmarked = bookmarked_res.scalar() is not None

    return PostResponse(
        id=post.id,
        user_id=post.user_id,
        content=post.content,
        image_url=post.image_url,
        tags=post.tags or [],
        time_spent=post.time_spent,
        type=post.type,
        created_at=post.created_at,
        user=post.user,
        likes_count=likes_count,
        comments_count=comments_count,
        user_has_liked=user_has_liked,
        user_has_bookmarked=user_has_bookmarked,
    )


@router.get("/feed/for-you", response_model=List[PostResponse])
async def get_for_you_feed(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    sort_by: str = Query("popular", regex="^(popular|new|relevant)$"),
    current_uid_str: Optional[str] = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    current_uid = uuid.UUID(current_uid_str) if current_uid_str else None
    offset = (page - 1) * limit

    query = select(Post).options(selectinload(Post.user))

    if sort_by == "new":
        query = query.order_by(desc(Post.created_at))
    else:
        query = query.order_by(desc(Post.created_at))

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    posts = result.scalars().all()

    return [await format_post_response(p, current_uid, db) for p in posts]


@router.get("/feed/following", response_model=List[PostResponse])
async def get_following_feed(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    current_uid_str: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    current_uid = uuid.UUID(current_uid_str)
    offset = (page - 1) * limit

    # Get user's followed accounts
    following_subq = select(Follow.following_id).where(Follow.follower_id == current_uid)
    
    query = (
        select(Post)
        .options(selectinload(Post.user))
        .where(Post.user_id.in_(following_subq))
        .order_by(desc(Post.created_at))
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    posts = result.scalars().all()

    return [await format_post_response(p, current_uid, db) for p in posts]


@router.get("/feed/college", response_model=List[PostResponse])
async def get_college_feed(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    current_uid_str: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    current_uid = uuid.UUID(current_uid_str)
    offset = (page - 1) * limit

    user_profile = await db.get(Profile, current_uid)
    if not user_profile or not user_profile.college:
        return []

    # Get posts from students in same college
    query = (
        select(Post)
        .join(Profile, Post.user_id == Profile.id)
        .options(selectinload(Post.user))
        .where(Profile.college == user_profile.college)
        .order_by(desc(Post.created_at))
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    posts = result.scalars().all()

    return [await format_post_response(p, current_uid, db) for p in posts]


@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    data: PostCreate,
    current_uid_str: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    current_uid = uuid.UUID(current_uid_str)
    new_post = Post(
        id=uuid.uuid4(),
        user_id=current_uid,
        content=data.content,
        image_url=data.image_url,
        tags=data.tags,
        time_spent=data.time_spent,
        type=data.type,
    )
    db.add(new_post)

    # Increment consistency score and streak
    profile = await db.get(Profile, current_uid)
    if profile:
        today = date.today()
        profile.consistency_score += 10
        if profile.last_post_date:
            diff = (today - profile.last_post_date).days
            if diff == 1:
                profile.streak += 1
            elif diff > 1:
                profile.streak = 1
        else:
            profile.streak = 1
        profile.last_post_date = today

    await db.flush()
    await db.refresh(new_post, ["user"])
    return await format_post_response(new_post, current_uid, db)


@router.post("/{post_id}/like", response_model=ActionToggleResponse)
async def toggle_like(
    post_id: uuid.UUID,
    current_uid_str: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    current_uid = uuid.UUID(current_uid_str)
    existing = await db.get(Like, (post_id, current_uid))
    if existing:
        await db.delete(existing)
        return ActionToggleResponse(status="unliked", post_id=post_id, user_id=current_uid, active=False)
    else:
        new_like = Like(post_id=post_id, user_id=current_uid)
        db.add(new_like)
        return ActionToggleResponse(status="liked", post_id=post_id, user_id=current_uid, active=True)


@router.post("/{post_id}/bookmark", response_model=ActionToggleResponse)
async def toggle_bookmark(
    post_id: uuid.UUID,
    current_uid_str: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    current_uid = uuid.UUID(current_uid_str)
    existing = await db.get(Bookmark, (post_id, current_uid))
    if existing:
        await db.delete(existing)
        return ActionToggleResponse(status="unbookmarked", post_id=post_id, user_id=current_uid, active=False)
    else:
        new_bm = Bookmark(post_id=post_id, user_id=current_uid)
        db.add(new_bm)
        return ActionToggleResponse(status="bookmarked", post_id=post_id, user_id=current_uid, active=True)


@router.post("/{post_id}/comments", response_model=CommentResponse)
async def add_comment(
    post_id: uuid.UUID,
    data: CommentCreate,
    current_uid_str: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    current_uid = uuid.UUID(current_uid_str)
    comment = Comment(
        id=uuid.uuid4(),
        post_id=post_id,
        user_id=current_uid,
        content=data.content
    )
    db.add(comment)
    await db.flush()
    await db.refresh(comment, ["user"])
    return comment
