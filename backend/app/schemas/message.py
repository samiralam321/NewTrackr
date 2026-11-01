from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from app.schemas.user import ProfileResponse


class MessageCreate(BaseModel):
    receiver_id: UUID
    content: str = Field(..., min_length=1, max_length=10000)


class MessageResponse(BaseModel):
    id: UUID
    sender_id: UUID
    receiver_id: UUID
    content: str
    is_read: bool = False
    created_at: datetime
    status: Optional[str] = "sent"

    class Config:
        from_attributes = True


class ConversationPreview(BaseModel):
    user: ProfileResponse
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0
    is_online: bool = False
