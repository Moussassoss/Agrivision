from fastapi import APIRouter, HTTPException
from app.services.isdasoil import get_soil_data
from app.models.response import SoilData
from app.utils.logger import get_logger
from app.utils.cache import cache_clear

logger = get_logger(__name__)
router = APIRouter()


@router.get("", response_model=SoilData)
async def soil(lat: float, lon: float):
    """
    Get soil properties for a GPS location.
    Automatically fetched from iSDAsoil at 30m resolution.
    """
    try:
        data = await get_soil_data(lat, lon)
        return SoilData(**data)
    except Exception as e:
        logger.error(f"Soil endpoint error: {e}")
        raise HTTPException(status_code=503, detail=f"Soil service error: {str(e)}")


@router.delete("/cache")
async def flush_soil_cache():
    """Clear the in-memory soil cache (forces fresh iSDAsoil fetch on next request)."""
    cache_clear()
    return {"message": "Soil cache cleared."}