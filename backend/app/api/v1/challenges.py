from datetime import date, datetime, timezone
from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.challenge import Question, DailyChallenge, Attempt
from app.models.user import Profile
from app.schemas.challenge import QuestionPublic, AttemptSubmit, AttemptResponse

router = APIRouter(prefix="/challenges", tags=["Daily Challenges Arena"])


@router.get("/today", response_model=List[QuestionPublic])
async def get_today_questions(
    current_uid_str: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    today = date.today()
    challenge_res = await db.execute(select(DailyChallenge).where(DailyChallenge.date == today))
    challenge = challenge_res.scalars().first()

    if not challenge or not challenge.question_ids:
        # Fallback: select random 5 questions from questions table
        sample_res = await db.execute(select(Question).limit(5))
        questions = sample_res.scalars().all()
        return questions

    # Fetch daily challenge questions
    q_res = await db.execute(select(Question).where(Question.id.in_(challenge.question_ids)))
    return q_res.scalars().all()


@router.post("/submit", response_model=AttemptResponse)
async def submit_challenge_attempt(
    data: AttemptSubmit,
    current_uid_str: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    current_uid = uuid.UUID(current_uid_str)

    # Check if already attempted today
    existing_attempt = await db.get(Attempt, (current_uid, data.challenge_date))
    if existing_attempt:
        raise HTTPException(status_code=400, detail="Challenge already attempted for this date")

    # Fetch questions to calculate accuracy
    challenge_res = await db.execute(select(DailyChallenge).where(DailyChallenge.date == data.challenge_date))
    challenge = challenge_res.scalars().first()
    
    score = 0
    total = len(data.answers)
    if challenge and challenge.question_ids:
        q_res = await db.execute(select(Question).where(Question.id.in_(challenge.question_ids)))
        questions = {str(q.id): q.correct_answer for q in q_res.scalars().all()}
        
        for q_id, user_ans in zip(challenge.question_ids, data.answers):
            if questions.get(str(q_id)) == user_ans:
                score += 20
    else:
        score = 80  # Default score if challenge date not pre-generated

    accuracy = (score / 100.0) * 100.0

    attempt = Attempt(
        user_id=current_uid,
        challenge_date=data.challenge_date,
        score=score,
        time_taken=data.time_taken,
        answers=data.answers,
        accuracy=accuracy
    )
    db.add(attempt)

    # Update streak & profile rank
    profile = await db.get(Profile, current_uid)
    new_streak = 0
    new_rank = "Bronze"
    if profile:
        profile.consistency_score += score
        profile.streak += 1
        new_streak = profile.streak

        if new_streak >= 30:
            new_rank = "Diamond"
        elif new_streak >= 14:
            new_rank = "Gold"
        elif new_streak >= 7:
            new_rank = "Silver"
        profile.challenge_rank = new_rank

    await db.flush()

    return AttemptResponse(
        challenge_date=data.challenge_date,
        score=score,
        time_taken=data.time_taken,
        accuracy=accuracy,
        streak_incremented=True,
        new_streak=new_streak,
        new_rank=new_rank
    )
