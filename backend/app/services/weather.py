import httpx
from app.config import get_settings
from app.utils.logger import get_logger
from app.utils.cache import cache_get, cache_set

logger = get_logger(__name__)
settings = get_settings()


async def get_weather_data(lat: float, lon: float) -> dict:
    """
    Fetch current weather from OpenWeatherMap +
    annual rainfall from NASA POWER.
    Results cached for 1 hour.

    Returns:
        {
            "temperature": float,   # °C
            "humidity":    float,   # %
            "rainfall":    float,   # annual mm
            "source":      "openweather+nasa"
        }
    """
    cache_key = f"weather:{lat:.3f}:{lon:.3f}"
    cached = cache_get(cache_key)
    if cached:
        logger.debug(f"Weather cache hit: {cache_key}")
        return cached

    logger.info(f"Fetching weather data for ({lat}, {lon})...")

    import asyncio
    (temperature, humidity), rainfall = await asyncio.gather(
        _get_openweather(lat, lon),
        _get_nasa_rainfall(lat, lon),
    )

    result = {
        "temperature": round(temperature, 2),
        "humidity":    round(humidity,    2),
        "rainfall":    round(rainfall,    2),
        "source":      "openweather+nasa",
    }

    # Cache for 1 hour
    cache_set(cache_key, result, ttl_seconds=3600)
    logger.info(f"Weather data: {result}")
    return result


async def _get_openweather(lat: float, lon: float) -> tuple[float, float]:
    """Return (temperature °C, humidity %) from OpenWeatherMap."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.openweather_base_url}/weather",
            params={
                "lat":   lat,
                "lon":   lon,
                "appid": settings.openweather_api_key,
                "units": "metric",
            },
            timeout=10.0,
        )
        resp.raise_for_status()
        data = resp.json()
        temperature = data["main"]["temp"]
        humidity    = data["main"]["humidity"]
        return temperature, humidity


async def _get_nasa_rainfall(lat: float, lon: float) -> float:
    """
    Return mean annual rainfall (mm) from NASA POWER climatology.
    Uses PRECTOTCORR — bias-corrected precipitation.
    """
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            settings.nasa_power_base_url,
            params={
                "parameters": "PRECTOTCORR",
                "community":  "AG",
                "longitude":  lon,
                "latitude":   lat,
                "format":     "JSON",
            },
            timeout=20.0,
        )
        resp.raise_for_status()
        data = resp.json()

        # NASA returns monthly averages — sum them for annual total
        monthly = data["properties"]["parameter"]["PRECTOTCORR"]
        # Keys are "JAN", "FEB", ..., "DEC", "ANN"
        annual = monthly.get("ANN")
        if annual and annual != -999:
            # NASA gives mm/day — multiply by 365 for annual mm
            return annual * 365

        # Fallback: sum monthly values manually
        months = ["JAN","FEB","MAR","APR","MAY","JUN",
                  "JUL","AUG","SEP","OCT","NOV","DEC"]
        total = sum(
            v * 30 for k, v in monthly.items()
            if k in months and v != -999
        )
        return total