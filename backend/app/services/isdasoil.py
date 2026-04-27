import httpx
from app.config import get_settings
from app.utils.logger import get_logger
from app.utils.cache import cache_get, cache_set
import asyncio

logger = get_logger(__name__)
settings = get_settings()


# ── Token management ────────────────────────────────
_token: str | None = None
_token_lock = asyncio.Lock()


async def _get_token() -> str:
    """Login to iSDAsoil and return a fresh access token."""
    global _token
    async with _token_lock:
        if _token:
            return _token

    logger.info("Authenticating with iSDAsoil...")
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.isda_base_url}/login",
            data={
                "username": settings.isda_username,
                "password": settings.isda_password,
            },
        )
        resp.raise_for_status()
        _token = resp.json()["access_token"]
        logger.info("iSDAsoil token obtained.")
        return _token


async def _fetch_property(
    lat: float,
    lon: float,
    property_name: str,
    depth: str = "0-20",
) -> float:
    """Fetch a single soil property for a GPS location."""
    token = await _get_token()

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.isda_base_url}/isdasoil/v2/soilproperty",
            params={
                "lat": lat,
                "lon": lon,
                "property": property_name,
                "depth": depth,
            },
            headers={"Authorization": f"Bearer {token}"},
            timeout=15.0,
        )

        # Token may have expired — refresh once and retry
        if resp.status_code == 401:
            global _token
            _token = None
            token = await _get_token()
            resp = await client.get(
                f"{settings.isda_base_url}/isdasoil/v2/soilproperty",
                params={
                    "lat": lat,
                    "lon": lon,
                    "property": property_name,
                    "depth": depth,
                },
                headers={"Authorization": f"Bearer {token}"},
                timeout=15.0,
            )

        resp.raise_for_status()
        data = resp.json()
        value = data["property"][property_name][0]["value"]["value"]
        return float(value)


async def get_soil_data(lat: float, lon: float) -> dict:
    """
    Fetch all soil properties needed for crop prediction.
    Results are cached for 24 hours per GPS coordinate.

    Returns:
        {
            "nitrogen":    float,  # mg/kg
            "phosphorus":  float,  # mg/kg
            "potassium":   float,  # mg/kg
            "ph":          float,
            "source":      "isdasoil"
        }
    """
    # Round to 3 decimal places for cache key (~100m precision)
    cache_key = f"soil:{lat:.3f}:{lon:.3f}"
    cached = cache_get(cache_key)
    if cached:
        logger.debug(f"Soil cache hit: {cache_key}")
        return cached

    logger.info(f"Fetching soil data from iSDAsoil for ({lat}, {lon})...")

    try:
        nitrogen, phosphorus, potassium, ph = await _fetch_all_properties(lat, lon)

        result = {
            "nitrogen":   round(nitrogen,   2),
            "phosphorus": round(phosphorus, 2),
            "potassium":  round(potassium,  2),
            "ph":         round(ph,         2),
            "source":     "isdasoil",
        }

        # Cache for 24 hours — soil doesn't change quickly
        cache_set(cache_key, result, ttl_seconds=86400)
        logger.info(f"Soil data: {result}")
        return result

    except Exception as e:
        logger.error(f"iSDAsoil error: {e}")
        raise


async def _fetch_all_properties(lat: float, lon: float):
    """Fetch N, P, K, pH concurrently."""
    import asyncio
    nitrogen, phosphorus, potassium, ph = await asyncio.gather(
        _fetch_property(lat, lon, "nitrogen_total"),
        _fetch_property(lat, lon, "phosphorous_extractable"),
        _fetch_property(lat, lon, "potassium_extractable"),
        _fetch_property(lat, lon, "ph"),
    )
    return nitrogen, phosphorus, potassium, ph