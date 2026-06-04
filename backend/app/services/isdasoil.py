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


# ── Unit calibration ────────────────────────────────────────────────────────
# iSDAsoil and the training dataset use different units / measurement methods.
#
# iSDAsoil returns:
#   nitrogen_total       → total soil N in g/kg   (Rwanda typical: 0.5–3.5 g/kg)
#   phosphorous_extract. → Mehlich-3 P in mg/kg   (Rwanda typical: 1–30 mg/kg)
#   potassium_extract.   → exchangeable K in mg/kg (Rwanda typical: 20–200 mg/kg)
#
# Training dataset (Cropvana_Rwanda_Dataset_v2.xlsx) expects:
#   N: 0–120  (mean 61)   — available N index
#   P: 5–95   (mean 44)   — available P index
#   K: 5–60   (mean 37)   — available K index
#
# Scale factors map iSDAsoil raw values → training-compatible values:
#   N_SCALE = 40  → 1.5 g/kg × 40 ≈ 60  (near training mean)
#   P_SCALE = 4.5 → 10 mg/kg × 4.5 ≈ 45 (near training mean)
#   K_SCALE = 0.5 → 75 mg/kg × 0.5 ≈ 37 (near training mean)
#
# After scaling, values are clamped to the training bounds so the model
# never has to extrapolate outside its fitted distribution.
_N_SCALE = 40.0;  _N_MIN =  0.0; _N_MAX = 120.0
_P_SCALE =  4.5;  _P_MIN =  5.0; _P_MAX =  95.0
_K_SCALE =  0.5;  _K_MIN =  5.0; _K_MAX =  60.0


def _calibrate(raw_n: float, raw_p: float, raw_k: float) -> tuple[float, float, float]:
    """Scale iSDAsoil raw values into the training-data value range."""
    n = max(_N_MIN, min(_N_MAX, raw_n * _N_SCALE))
    p = max(_P_MIN, min(_P_MAX, raw_p * _P_SCALE))
    k = max(_K_MIN, min(_K_MAX, raw_k * _K_SCALE))
    return n, p, k


async def get_soil_data(lat: float, lon: float) -> dict:
    """
    Fetch all soil properties needed for crop prediction.
    Results are cached for 24 hours per GPS coordinate.

    Returns:
        {
            "nitrogen":    float,  # calibrated to training range 0–120
            "phosphorus":  float,  # calibrated to training range 5–95
            "potassium":   float,  # calibrated to training range 5–60
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
        raw_n, raw_p, raw_k, ph = await _fetch_all_properties(lat, lon)
        logger.info(f"iSDAsoil raw values — N={raw_n} g/kg, P={raw_p} mg/kg, K={raw_k} mg/kg, pH={ph}")

        nitrogen, phosphorus, potassium = _calibrate(raw_n, raw_p, raw_k)
        logger.info(f"Calibrated values  — N={nitrogen:.1f}, P={phosphorus:.1f}, K={potassium:.1f}")

        result = {
            "nitrogen":   round(nitrogen,   2),
            "phosphorus": round(phosphorus, 2),
            "potassium":  round(potassium,  2),
            "ph":         round(ph,         2),
            "source":     "isdasoil",
        }

        # Cache for 24 hours — soil doesn't change quickly
        cache_set(cache_key, result, ttl_seconds=86400)
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