from typing import Optional
from datetime import datetime, date
from uuid import UUID
from pydantic import BaseModel, Field


class ProfileBase(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    college: Optional[str] = None
    resume_url: Optional[str] = None
    resume_name: Optional[str] = None


class ProfileUpdate(ProfileBase):
    pass


class ProfileResponse(ProfileBase):
    id: UUID
    consistency_score: int = 0
    streak: int = 0
    challenge_rank: str = "Bronze"
    last_post_date: Optional[date] = None
    badge_level: int = 0
    badge_earned_at: Optional[datetime] = None
    is_following: Optional[bool] = False
    followers_count: Optional[int] = 0
    following_count: Optional[int] = 0
    posts_count: Optional[int] = 0

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    id: UUID
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    college: Optional[str] = None
    consistency_score: int
    streak: int
    badge_level: int
    rank: int


class FollowToggleResponse(BaseModel):
    is_following: bool
    follower_id: UUID
    following_id: UUID
