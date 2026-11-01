from typing import Optional, List, Literal
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from app.schemas.user import ProfileResponse


class PostCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    image_url: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    time_spent: Optional[int] = None
    type: Optional[Literal["Learned", "Built", "Practiced", "Other"]] = "Learned"


class PostUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, max_length=5000)
    tags: Optional[List[str]] = None
    type: Optional[Literal["Learned", "Built", "Practiced", "Other"]] = None


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)


class CommentResponse(BaseModel):
    id: UUID
    post_id: UUID
    user_id: UUID
    content: str
    created_at: datetime
    user: Optional[ProfileResponse] = None

    class Config:
        from_attributes = True


class PostResponse(BaseModel):
    id: UUID
    user_id: UUID
    content: str
    image_url: Optional[str] = None
    tags: List[str] = []
    time_spent: Optional[int] = None
    type: Optional[str] = None
    created_at: datetime
    user: Optional[ProfileResponse] = None
    likes_count: int = 0
    comments_count: int = 0
    user_has_liked: bool = False
    user_has_bookmarked: bool = False

    class Config:
        from_attributes = True


class ActionToggleResponse(BaseModel):
    status: str
    post_id: UUID
    user_id: UUID
    active: bool
