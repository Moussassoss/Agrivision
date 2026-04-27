import time
from typing import Any
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Simple in-memory cache: { key: (value, expires_at) }
_cache: dict[str, tuple[Any, float]] = {}


def cache_get(key: str) -> Any | None:
    """Return cached value if it exists and hasn't expired."""
    entry = _cache.get(key)
    if entry is None:
        return None
    value, expires_at = entry
    if time.time() > expires_at:
        del _cache[key]
        return None
    return value


def cache_set(key: str, value: Any, ttl_seconds: int = 3600) -> None:
    """Store a value in cache with a TTL (default 1 hour)."""
    _cache[key] = (value, time.time() + ttl_seconds)
    logger.debug(f"Cache set: {key} (TTL={ttl_seconds}s)")


def cache_clear() -> None:
    """Clear all cached entries (useful in tests)."""
    _cache.clear()