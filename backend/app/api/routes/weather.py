from fastapi import APIRouter, HTTPException
from app.services.weather import get_weather_data
from app.models.response import WeatherData
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.get("", response_model=WeatherData)
async def weather(lat: float, lon: float):
    """
    Get weather data for a GPS location.
    Temperature & humidity from OpenWeather, rainfall from NASA POWER.
    """
    try:
        data = await get_weather_data(lat, lon)
        return WeatherData(**data)
    except Exception as e:
        logger.error(f"Weather endpoint error: {e}")
        raise HTTPException(status_code=503, detail=f"Weather service error: {str(e)}")