from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.database import Base
import uuid


class User(Base):
    __tablename__ = "users"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email      = Column(String(255), unique=True, nullable=False, index=True)
    full_name  = Column(String(255), nullable=False)
    phone      = Column(String(50), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class RecommendationHistory(Base):
    __tablename__ = "recommendation_history"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), nullable=False, index=True)
    latitude    = Column(Float, nullable=False)
    longitude   = Column(Float, nullable=False)

    # Soil inputs
    nitrogen    = Column(Float)
    phosphorus  = Column(Float)
    potassium   = Column(Float)
    ph          = Column(Float)
    soil_source = Column(String(50))

    # Weather inputs
    temperature = Column(Float)
    humidity    = Column(Float)
    rainfall    = Column(Float)

    # Results (stored as JSON string)
    top_crops   = Column(Text)

    created_at  = Column(DateTime(timezone=True), server_default=func.now())