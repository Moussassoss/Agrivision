import logging
import sys


def get_logger(name: str) -> logging.Logger:
    """Return a configured logger for any module."""
    logger = logging.getLogger(name)

    if logger.handlers:
        return logger  # Already configured

    # Lazy-load settings so logger can be imported without a .env file
    try:
        from app.config import get_settings
        level = logging.DEBUG if get_settings().debug else logging.INFO
    except Exception:
        level = logging.INFO

    logger.setLevel(level)

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    return logger