import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, Date, DateTime, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from app.core.database import Base


class Question(Base):
    __tablename__ = "questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic = Column(String(50), nullable=False)  # 'DSA', 'OOPS', 'OS', 'DBMS', 'Aptitude', 'AI', 'CN'
    difficulty = Column(String(50), nullable=False)  # 'Medium', 'Hard'
    question = Column(Text, nullable=False)
    options = Column(JSONB, nullable=False)  # List[str]
    correct_answer = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class DailyChallenge(Base):
    __tablename__ = "daily_challenges"

    date = Column(Date, primary_key=True)
    question_ids = Column(ARRAY(UUID(as_uuid=True)), nullable=False)

    attempts = relationship("Attempt", back_populates="challenge", cascade="all, delete-orphan")


class Attempt(Base):
    __tablename__ = "attempts"

    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    challenge_date = Column(Date, ForeignKey("daily_challenges.date", ondelete="CASCADE"), primary_key=True)
    score = Column(Integer, nullable=False)
    time_taken = Column(Integer, nullable=False)  # in seconds
    answers = Column(JSONB, nullable=False)       # List[str]
    accuracy = Column(Numeric(5, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("Profile", back_populates="attempts")
    challenge = relationship("DailyChallenge", back_populates="attempts")
