from sqlalchemy import Column, String, Boolean, DateTime, Float, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.database import Base
import uuid


class User(Base):
    __tablename__ = "users"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email           = Column(String(255), unique=True, nullable=False, index=True)
    full_name       = Column(String(255), nullable=False)
    phone           = Column(String(50), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())


class PasswordResetToken(Base):
    """6-digit OTP stored in DB — replaces the in-memory dict."""
    __tablename__ = "password_reset_tokens"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email      = Column(String(255), nullable=False, index=True)
    otp        = Column(String(6), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used       = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RecommendationHistory(Base):
    __tablename__ = "recommendation_history"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    latitude    = Column(Float, nullable=False)
    longitude   = Column(Float, nullable=False)

    nitrogen    = Column(Float)
    phosphorus  = Column(Float)
    potassium   = Column(Float)
    ph          = Column(Float)
    soil_source = Column(String(50))

    temperature = Column(Float)
    humidity    = Column(Float)
    rainfall    = Column(Float)

    top_crops   = Column(Text)

    created_at  = Column(DateTime(timezone=True), server_default=func.now())
