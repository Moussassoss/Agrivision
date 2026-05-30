from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import bcrypt as _bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Annotated
import uuid
import secrets
from app.db.database import get_db
from app.db.models import User
from app.models.request import UserRegister
from app.models.response import TokenResponse
from app.config import get_settings
from app.utils.logger import get_logger

logger   = get_logger(__name__)
settings = get_settings()
router   = APIRouter()

# ── Password hashing ────────────────────────────────
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: str, email: str) -> str:
    expire = datetime.utcnow() + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {
        "sub":   user_id,
        "email": email,
        "exp":   expire,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db:    AsyncSession = Depends(get_db),
) -> User:
    """FastAPI dependency — decode JWT and return the current user."""
    credentials_exception = HTTPException(
        status_code=401,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload  = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id  = payload.get("sub")
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
async def register(body: UserRegister, db: AsyncSession = Depends(get_db)):
    """Create a new farmer account."""
    # Check email not already taken
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
    return {
        "message": "Account created successfully",
        "user_id": str(user.id),
        "email":   user.email,
    }


@router.post("/login", response_model=TokenResponse)
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db:   AsyncSession = Depends(get_db),
):
    """Login with email + password, returns JWT token."""
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
    """Return the currently logged-in user's profile."""
    return {
        "user_id":   str(current_user.id),
        "email":     current_user.email,
        "full_name": current_user.full_name,
        "phone":     current_user.phone,
    }


# In-memory store for reset tokens
# { token: {"email": str, "expires": datetime} }
_reset_tokens: dict = {}


@router.post("/forgot-password")
async def forgot_password(
    email: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a password reset token.
    In production: send this token via email.
    For now: return it directly so you can test.
    """
    result = await db.execute(select(User).where(User.email == email))
    user   = result.scalar_one_or_none()

    # Always return success — don't reveal if email exists
    if not user:
        return {"message": "If that email exists, a reset link was sent."}

    token = secrets.token_urlsafe(32)
    _reset_tokens[token] = {
        "email":   email,
        "expires": datetime.utcnow() + timedelta(hours=1),
    }

    logger.info(f"Password reset token generated for {email}")

    # TODO: send email with token
    # In production, send: https://yourapp.com/reset-password?token={token}
    # For now we return it directly for testing:
    return {
        "message": "Reset token generated.",
        "token":   token,   # Remove this line in production
        "expires": "1 hour",
    }


@router.post("/reset-password")
async def reset_password(
    token: str,
    new_password: str,
    db: AsyncSession = Depends(get_db),
):
    """Reset password using the token from /forgot-password."""
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    entry = _reset_tokens.get(token)
    if not entry:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if datetime.utcnow() > entry["expires"]:
        del _reset_tokens[token]
        raise HTTPException(status_code=400, detail="Reset token has expired")

    result = await db.execute(select(User).where(User.email == entry["email"]))
    user   = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(new_password)
    await db.commit()

    # Invalidate token after use
    del _reset_tokens[token]

    logger.info(f"Password reset successful for {entry['email']}")
    return {"message": "Password updated successfully. Please log in again."}