from typing import List
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, update
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.notification import Notification
from app.models.user import Profile
from app.schemas.challenge import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    current_uid_str: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    current_uid = uuid.UUID(current_uid_str)
    stmt = (
        select(Notification)
        .options(selectinload(Notification.actor))
        .where(Notification.user_id == current_uid)
        .order_by(desc(Notification.created_at))
        .limit(40)
    )
    result = await db.execute(stmt)
    notifications = result.scalars().all()

    output = []
    for n in notifications:
        actor_data = {
            "full_name": n.actor.full_name if n.actor else "Trackr Student",
            "avatar_url": n.actor.avatar_url if n.actor else None
        }
        output.append(
            NotificationResponse(
                id=n.id,
                user_id=n.user_id,
                actor_id=n.actor_id,
                type=n.type,
                post_id=n.post_id,
                is_read=n.is_read,
                created_at=n.created_at,
                actor=actor_data
            )
        )
    return output


@router.post("/read")
async def mark_notifications_read(
    current_uid_str: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    current_uid = uuid.UUID(current_uid_str)
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_uid)
        .values(is_read=True)
    )
    return {"status": "ok"}
