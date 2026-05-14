from fastapi import APIRouter, HTTPException
from app.models.request import RecommendRequest
from app.models.response import RecommendResponse, SoilData, WeatherData, CropRecommendation
from app.services.isdasoil import get_soil_data
from app.services.weather import get_weather_data
from app.services.recommendation import build_recommendations
from app.ml.predictor import predict, load_model
from app.utils.logger import get_logger
from app.api.routes.auth import get_current_user
from app.db.models import User
from fastapi import Depends
import json
from app.db.database import get_db
from app.db.models import RecommendationHistory
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import AsyncSessionLocal


logger = get_logger(__name__)
router = APIRouter()


@router.post("", response_model=RecommendResponse)
async def recommend(
    body: RecommendRequest,
    current_user: User = Depends(get_current_user),
    ):
    """
    Main endpoint — given a GPS location, return top 3 crop recommendations.

    Flow:
      1. Fetch soil data from iSDAsoil (or use manual override)
      2. Fetch weather from OpenWeather + NASA POWER
      3. Run ML model
      4. Enrich with planting calendar and agronomic advice
    """
    lat = body.location.latitude
    lon = body.location.longitude

    # ── 1. Soil data ────────────────────────────────
    try:
        raw_soil = await get_soil_data(lat, lon)
        soil = dict(raw_soil)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Could not fetch soil data: {e}")

    # Apply manual overrides if provided
    if body.soil_override:
        override = body.soil_override
        if override.nitrogen   is not None: soil["nitrogen"]   = override.nitrogen
        if override.phosphorus is not None: soil["phosphorus"] = override.phosphorus
        if override.potassium  is not None: soil["potassium"]  = override.potassium
        if override.ph         is not None: soil["ph"]         = override.ph
        soil["source"] = "manual+isdasoil"
        logger.info(f"Soil override applied: {override}")

    # ── 2. Weather data ─────────────────────────────
    try:
        weather = await get_weather_data(lat, lon)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Could not fetch weather data: {e}")

    # ── 3. ML prediction ────────────────────────────
    try:
        predictions = predict(
            N           = soil["nitrogen"],
            P           = soil["phosphorus"],
            K           = soil["potassium"],
            temperature = weather["temperature"],
            humidity    = weather["humidity"],
            ph          = soil["ph"],
            rainfall    = weather["rainfall"],
            top_n       = 3,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {e}")

    # ── 4. Build rich recommendations ───────────────
    enriched = build_recommendations(predictions, soil, weather)

# ── 5. Save to history ──────────────────────────
   

    async with AsyncSessionLocal() as db:
        history = RecommendationHistory(
            user_id     = current_user.id,
            latitude    = lat,
            longitude   = lon,
            nitrogen    = soil["nitrogen"],
            phosphorus  = soil["phosphorus"],
            potassium   = soil["potassium"],
            ph          = soil["ph"],
            soil_source = soil["source"],
            temperature = weather["temperature"],
            humidity    = weather["humidity"],
            rainfall    = weather["rainfall"],
            top_crops   = json.dumps(enriched),
        )
        db.add(history)
        await db.commit()
        logger.info(f"Recommendation saved for user {current_user.id}")

    return RecommendResponse(
        top_crops    = [CropRecommendation(**c) for c in enriched],
        soil_used    = SoilData(**soil),
        weather_used = WeatherData(**weather),
    )


@router.get("/history")
async def history(
    current_user: User = Depends(get_current_user),
    limit: int = 10,
):
    """Return the last N recommendations for the logged-in farmer."""
    from sqlalchemy import select, desc

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(RecommendationHistory)
            .where(RecommendationHistory.user_id == current_user.id)
            .order_by(desc(RecommendationHistory.created_at))
            .limit(limit)
        )
        records = result.scalars().all()

    return [
        {
            "id":          str(r.id),
            "latitude":    r.latitude,
            "longitude":   r.longitude,
            "top_crops":   json.loads(r.top_crops),
            "soil": {
                "nitrogen":   r.nitrogen,
                "phosphorus": r.phosphorus,
                "potassium":  r.potassium,
                "ph":         r.ph,
                "source":     r.soil_source,
            },
            "weather": {
                "temperature": r.temperature,
                "humidity":    r.humidity,
                "rainfall":    r.rainfall,
            },
            "created_at": r.created_at.isoformat(),
        }
        for r in records
    ]