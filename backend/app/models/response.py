from pydantic import BaseModel, Field
from typing import Optional


class SoilData(BaseModel):
    """Soil properties used for prediction."""
    nitrogen: float = Field(..., description="N in mg/kg")
    phosphorus: float = Field(..., description="P in mg/kg")
    potassium: float = Field(..., description="K in mg/kg")
    ph: float = Field(..., description="Soil pH")
    source: str = Field(..., description="'isdasoil' or 'manual'")


class WeatherData(BaseModel):
    """Weather & climate data used for prediction."""
    temperature: float = Field(..., description="Mean temp in °C")
    humidity: float = Field(..., description="Relative humidity %")
    rainfall: float = Field(..., description="Annual rainfall in mm")
    source: str = Field(..., description="'openweather' or 'nasa_power'")


class FertilizerAdvice(BaseModel):
    """Fertilizer recommendation items + application note."""
    items: list[str] = Field(..., description="Per-nutrient advice lines")
    note: str = Field(..., description="General application guidance")


class CropRecommendation(BaseModel):
    """A single recommended crop with confidence and advice."""
    crop: str = Field(..., description="Crop name e.g. 'maize'")
    confidence: float = Field(..., ge=0, le=1, description="Model confidence 0-1")
    planting_season: str = Field(..., description="Best planting window")
    why: str = Field(..., description="Short human-readable reason")
    fertilizer: FertilizerAdvice = Field(..., description="Soil-based fertilizer advice")


class RecommendResponse(BaseModel):
    """Full response from POST /recommend."""
    top_crops: list[CropRecommendation] = Field(..., description="Top 3 recommended crops")
    soil_used: SoilData
    weather_used: WeatherData
    disclaimer: str = "Recommendations are AI-assisted. Always consult a local agronomist."


class HealthResponse(BaseModel):
    status: str
    version: str
    model_loaded: bool


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None