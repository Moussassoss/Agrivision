from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.db.database import get_db
from app.db.models import User, PasswordResetToken
from app.models.request import UserRegister
from app.models.response import TokenResponse
from app.config import get_settings
from app.utils.logger import get_logger

limiter = Limiter(key_func=get_remote_address)
from app.services.email import send_welcome_email, send_password_reset_email
import bcrypt as _bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from typing import Annotated
import uuid
import random

logger   = get_logger(__name__)
settings = get_settings()
router   = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ── Password helpers ────────────────────────────────

def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: str, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    return jwt.encode(
        {"sub": user_id, "email": email, "exp": expire},
        settings.secret_key,
        algorithm=settings.algorithm,
    )


# ── Auth dependency ─────────────────────────────────

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db:    AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user   = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


# ── Routes ──────────────────────────────────────────

@router.post("/register", status_code=201)
@limiter.limit("5/minute")
async def register(request: Request, body: UserRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email           = body.email,
        full_name       = body.full_name,
        phone           = body.phone,
        hashed_password = hash_password(body.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    logger.info(f"New user registered: {user.email}")

    # Fire-and-forget — don't fail registration if email delivery fails
    try:
        await send_welcome_email(to_email=user.email, full_name=user.full_name)
    except Exception as exc:
        logger.error(f"Welcome email failed for {user.email}: {exc}")

    return {
        "message": "Account created successfully",
        "user_id": str(user.id),
        "email":   user.email,
    }


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    form: OAuth2PasswordRequestForm = Depends(),
    db:   AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == form.username))
    user   = result.scalar_one_or_none()

    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    token = create_access_token(str(user.id), user.email)
    logger.info(f"User logged in: {user.email}")
    return TokenResponse(access_token=token)


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {
        "user_id":   str(current_user.id),
        "email":     current_user.email,
        "full_name": current_user.full_name,
        "phone":     current_user.phone,
    }


@router.post("/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(
    request: Request,
    email: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a 6-digit OTP and email it to the user.
    Always returns 200 so callers cannot enumerate registered emails.
    """
    result = await db.execute(select(User).where(User.email == email))
    user   = result.scalar_one_or_none()

    if not user:
        return {"message": "If that email is registered, a reset code was sent."}

    # Delete any previous unused tokens for this email
    await db.execute(
        delete(PasswordResetToken).where(PasswordResetToken.email == email)
    )

    otp = f"{random.SystemRandom().randint(0, 999999):06d}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expire_minutes)

    db.add(PasswordResetToken(email=email, otp=otp, expires_at=expires_at))
    await db.commit()

    # Send email (logs OTP to console if RESEND_API_KEY not set)
    await send_password_reset_email(
        to_email=email,
        full_name=user.full_name,
        otp=otp,
    )

    return {"message": "If that email is registered, a reset code was sent."}


@router.post("/reset-password")
async def reset_password(
    token: str,
    new_password: str,
    db: AsyncSession = Depends(get_db),
):
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.otp   == token,
            PasswordResetToken.used  == False,  # noqa: E712
        )
    )
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")

    if datetime.now(timezone.utc) > record.expires_at.replace(tzinfo=timezone.utc):
        await db.delete(record)
        await db.commit()
        raise HTTPException(status_code=400, detail="Reset code has expired")

    user_result = await db.execute(select(User).where(User.email == record.email))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(new_password)
    record.used = True
    await db.commit()

    logger.info(f"Password reset successful for {record.email}")
    return {"message": "Password updated successfully. Please log in again."}
