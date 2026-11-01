from typing import Optional, List, Any
from datetime import datetime, date
from uuid import UUID
from pydantic import BaseModel, Field


class QuestionPublic(BaseModel):
    id: UUID
    topic: str
    difficulty: str
    question: str
    options: List[str]

    class Config:
        from_attributes = True


class AttemptSubmit(BaseModel):
    challenge_date: date
    time_taken: int  # in seconds
    answers: List[str]


class AttemptResponse(BaseModel):
    challenge_date: date
    score: int
    time_taken: int
    accuracy: float
    streak_incremented: bool = False
    new_streak: int = 0
    new_rank: str = "Bronze"

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    actor_id: UUID
    type: str
    post_id: Optional[UUID] = None
    is_read: bool
    created_at: datetime
    actor: Optional[dict] = None

    class Config:
        from_attributes = True
