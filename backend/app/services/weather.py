import httpx
from datetime import datetime, date
from app.config import get_settings
from app.utils.logger import get_logger
from app.utils.cache import cache_get, cache_set

logger   = get_logger(__name__)
settings = get_settings()


def _get_current_season_dates() -> tuple[str, str]:
    """
    Return (start_date, end_date) for the current growing season.
    Rwanda seasons:
      Season A : Sep 1  – Feb 28
      Season B : Mar 1  – Jun 30
      Dry      : Jul 1  – Aug 31 (use season B dates as fallback)
    Dates formatted as YYYYMMDD for NASA POWER API.
    """
    today = date.today()
    month = today.month
    year  = today.year

    if month >= 9:
        # Season A: Sep – Dec of this year
        start = date(year, 9, 1)
        end   = today
    elif month <= 2:
        # Season A: Sep last year – Feb this year
        start = date(year - 1, 9, 1)
        end   = today
    elif month <= 6:
        # Season B: Mar – Jun
        start = date(year, 3, 1)
        end   = today
    else:
        # Dry season Jul–Aug: use last Season B
        start = date(year, 3, 1)
        end   = date(year, 6, 30)

    return start.strftime("%Y%m%d"), end.strftime("%Y%m%d")


async def get_weather_data(lat: float, lon: float) -> dict:
    """
    Fetch weather data for crop prediction:
    - Temperature & humidity from OpenWeatherMap (current)
    - Seasonal rainfall from NASA POWER daily API (current growing season)

    Returns:
        {
            "temperature": float,   # °C
            "humidity":    float,   # %
            "rainfall":    float,   # mm for current season
            "source":      str,
        }
    """
    cache_key = f"weather:{lat:.3f}:{lon:.3f}"
    cached    = cache_get(cache_key)
    if cached:
        logger.debug(f"Weather cache hit: {cache_key}")
        return cached

    logger.info(f"Fetching weather for ({lat}, {lon})...")

    import asyncio
    (temperature, humidity), rainfall = await asyncio.gather(
        _get_openweather(lat, lon),
        _get_seasonal_rainfall(lat, lon),
    )

    result = {
        "temperature": round(temperature, 2),
        "humidity":    round(humidity,    2),
        "rainfall":    round(rainfall,    2),
        "source":      "openweather+nasa_seasonal",
    }

    # Cache for 1 hour
    cache_set(cache_key, result, ttl_seconds=3600)
    logger.info(f"Weather result: {result}")
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
        data        = resp.json()
        temperature = data["main"]["temp"]
        humidity    = data["main"]["humidity"]
        return temperature, humidity


async def _get_seasonal_rainfall(lat: float, lon: float) -> float:
    """
    Return total rainfall in mm for the current growing season.
    Uses NASA POWER daily API — sums PRECTOTCORR (mm/day) over season days.
    """
    start_date, end_date = _get_current_season_dates()
    logger.info(f"Fetching seasonal rainfall {start_date} → {end_date}")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://power.larc.nasa.gov/api/temporal/daily/point",
            params={
                "parameters": "PRECTOTCORR",
                "community":  "AG",
                "longitude":  lon,
                "latitude":   lat,
                "start":      start_date,
                "end":        end_date,
                "format":     "JSON",
            },
            timeout=30.0,
        )
        resp.raise_for_status()
        data = resp.json()

        daily_values = data["properties"]["parameter"]["PRECTOTCORR"]

        # Sum all valid daily values (skip -999 missing values)
        total_mm = sum(
            v for v in daily_values.values()
            if v != -999 and v is not None
        )

        logger.info(
            f"Seasonal rainfall: {total_mm:.1f}mm "
            f"over {len(daily_values)} days"
        )
        return total_mm