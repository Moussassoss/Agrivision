from pydantic import BaseModel, Field
from typing import Optional


class LocationInput(BaseModel):
    """GPS coordinates from the farmer's phone."""
    latitude: float = Field(..., ge=-90, le=90, description="Decimal degrees")
    longitude: float = Field(..., ge=-180, le=180, description="Decimal degrees")


class SoilOverride(BaseModel):
    """
    Optional manual N, P, K values from a lab slip.
    If provided, these override the iSDAsoil API values.
    """
    nitrogen: Optional[float] = Field(None, ge=0, description="N in mg/kg")
    phosphorus: Optional[float] = Field(None, ge=0, description="P in mg/kg")
    potassium: Optional[float] = Field(None, ge=0, description="K in mg/kg")
    ph: Optional[float] = Field(None, ge=0, le=14, description="Soil pH")


class RecommendRequest(BaseModel):
    """
    Main request body for POST /recommend.
    Only location is required — everything else is optional.
    """
    location: LocationInput
    soil_override: Optional[SoilOverride] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "location": {"latitude": -1.789, "longitude": 29.710},
                    "soil_override": None,
                },
                {
                    "location": {"latitude": -1.789, "longitude": 29.710},
                    "soil_override": {
                        "nitrogen": 40.0,
                        "phosphorus": 35.0,
                        "potassium": 200.0,
                        "ph": 6.2,
                    },
                },
            ]
        }
    }


class UserRegister(BaseModel):
    email: str = Field(..., description="Farmer's email address")
    password: str = Field(..., min_length=8, description="Min 8 characters")
    full_name: str = Field(..., min_length=2)
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str