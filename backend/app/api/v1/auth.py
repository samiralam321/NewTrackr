from datetime import timedelta
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    create_refresh_token, 
    get_current_user_id,
    decode_token
)
from app.models.user import Profile
from app.schemas.auth import (
    LoginRequest, 
    RegisterRequest, 
    TokenResponse, 
    PasswordResetRequest
)
from app.schemas.user import ProfileResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Create new profile
    new_user_id = uuid.uuid4()
    profile = Profile(
        id=new_user_id,
        full_name=data.full_name,
        college=data.college,
        avatar_url=f"https://ui-avatars.com/api/?name={data.full_name}&background=7C3AED&color=fff",
        consistency_score=0,
        streak=0,
        badge_level=0,
    )
    db.add(profile)
    await db.flush()

    token_data = {"sub": str(new_user_id), "email": data.email, "name": data.full_name}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=str(new_user_id),
        full_name=profile.full_name,
        avatar_url=profile.avatar_url,
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Look up user profile
    result = await db.execute(
        select(Profile).where(Profile.full_name.ilike(data.email.split("@")[0]))
    )
    profile = result.scalars().first()

    # If no profile by email prefix, create/retrieve active user profile
    if not profile:
        profile = Profile(
            id=uuid.uuid4(),
            full_name=data.email.split("@")[0],
            avatar_url=f"https://ui-avatars.com/api/?name={data.email.split('@')[0]}&background=7C3AED&color=fff",
        )
        db.add(profile)
        await db.flush()

    token_data = {"sub": str(profile.id), "email": data.email, "name": profile.full_name}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=str(profile.id),
        full_name=profile.full_name,
        avatar_url=profile.avatar_url,
    )


@router.get("/me", response_model=ProfileResponse)
async def get_me(current_user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Profile).where(Profile.id == uuid.UUID(current_user_id)))
    profile = result.scalars().first()
    if not profile:
        # Auto-create if authenticated externally via Supabase token
        profile = Profile(
            id=uuid.UUID(current_user_id),
            full_name="Trackr User",
            avatar_url="https://ui-avatars.com/api/?name=User&background=7C3AED&color=fff"
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    return profile


@router.post("/refresh")
async def refresh_token(refresh_token: str):
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user_id = payload.get("sub")
    new_token = create_access_token({"sub": user_id})
    return {"access_token": new_token, "token_type": "bearer"}
