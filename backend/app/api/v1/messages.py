from datetime import datetime
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc, func
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.core.redis import PresenceManager
from app.models.message import Message
from app.models.user import Profile
from app.schemas.message import (
    MessageCreate, 
    MessageResponse, 
    ConversationPreview
)
from app.schemas.user import ProfileResponse
from app.websockets.connection_manager import ws_manager

router = APIRouter(prefix="/messages", tags=["Real-Time Messaging"])


@router.get("/conversations", response_model=List[ConversationPreview])
async def get_conversations(
    current_uid_str: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    current_uid = uuid.UUID(current_uid_str)

    # Find all messages involving current user
    msgs_res = await db.execute(
        select(Message)
        .where(or_(Message.sender_id == current_uid, Message.receiver_id == current_uid))
        .order_by(desc(Message.created_at))
    )
    all_msgs = msgs_res.scalars().all()

    conversations_map = {}
    unread_map = {}

    for m in all_msgs:
        other_id = m.receiver_id if m.sender_id == current_uid else m.sender_id
        if other_id not in conversations_map:
            conversations_map[other_id] = m

        if m.sender_id != current_uid and not m.is_read:
            unread_map[other_id] = unread_map.get(other_id, 0) + 1

    if not conversations_map:
        return []

    # Bulk fetch profiles
    other_ids = list(conversations_map.keys())
    profiles_res = await db.execute(select(Profile).where(Profile.id.in_(other_ids)))
    profiles_list = profiles_res.scalars().all()

    # Bulk fetch presence from Redis
    presence_statuses = await PresenceManager.get_online_status_bulk([str(uid) for uid in other_ids])

    result = []
    for profile in profiles_list:
        last_msg = conversations_map.get(profile.id)
        is_online = presence_statuses.get(str(profile.id), False)
        result.append(
            ConversationPreview(
                user=ProfileResponse.model_validate(profile),
                last_message=MessageResponse.model_validate(last_msg) if last_msg else None,
                unread_count=unread_map.get(profile.id, 0),
                is_online=is_online,
            )
        )

    # Sort conversations by most recent message
    result.sort(
        key=lambda x: x.last_message.created_at if x.last_message else datetime.min, 
        reverse=True
    )
    return result


@router.get("/chat/{other_user_id}", response_model=List[MessageResponse])
async def get_chat_history(
    other_user_id: uuid.UUID,
    limit: int = Query(50, ge=1, le=100),
    current_uid_str: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    current_uid = uuid.UUID(current_uid_str)

    query = (
        select(Message)
        .where(
            or_(
                and_(Message.sender_id == current_uid, Message.receiver_id == other_user_id),
                and_(Message.sender_id == other_user_id, Message.receiver_id == current_uid),
            )
        )
        .order_by(Message.created_at.asc())
        .limit(limit)
    )
    result = await db.execute(query)
    messages = result.scalars().all()
    return messages


@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    data: MessageCreate,
    current_uid_str: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    current_uid = uuid.UUID(current_uid_str)

    new_msg = Message(
        id=uuid.uuid4(),
        sender_id=current_uid,
        receiver_id=data.receiver_id,
        content=data.content,
        is_read=False,
    )
    db.add(new_msg)
    await db.flush()

    msg_payload = {
        "id": str(new_msg.id),
        "sender_id": str(new_msg.sender_id),
        "receiver_id": str(new_msg.receiver_id),
        "content": new_msg.content,
        "is_read": False,
        "created_at": new_msg.created_at.isoformat(),
        "status": "sent"
    }

    # Instant Real-time WebSocket delivery via Redis Pub/Sub cluster
    await ws_manager.broadcast_event(
        target_user_id=str(data.receiver_id),
        event_type="chat_message",
        data=msg_payload
    )

    return new_msg


@router.post("/chat/{other_user_id}/read")
async def mark_messages_as_read(
    other_user_id: uuid.UUID,
    current_uid_str: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    current_uid = uuid.UUID(current_uid_str)

    await db.execute(
        select(Message)
        .where(and_(Message.sender_id == other_user_id, Message.receiver_id == current_uid, Message.is_read == False))
    )
    # Update status
    from sqlalchemy import update
    await db.execute(
        update(Message)
        .where(and_(Message.sender_id == other_user_id, Message.receiver_id == current_uid, Message.is_read == False))
        .values(is_read=True)
    )

    # Notify sender that messages were read
    await ws_manager.broadcast_event(
        target_user_id=str(other_user_id),
        event_type="messages_read",
        data={"reader_id": str(current_uid)}
    )

    return {"status": "ok"}


@router.get("/directory/search", response_model=List[ProfileResponse])
async def search_students(
    query: str = Query("", max_length=100),
    current_uid_str: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    current_uid = uuid.UUID(current_uid_str)
    search_filter = Profile.id != current_uid
    if query.strip():
        search_filter = and_(
            search_filter,
            or_(
                Profile.full_name.ilike(f"%{query.strip()}%"),
                Profile.college.ilike(f"%{query.strip()}%")
            )
        )

    stmt = select(Profile).where(search_filter).order_by(desc(Profile.consistency_score)).limit(30)
    result = await db.execute(stmt)
    return result.scalars().all()
