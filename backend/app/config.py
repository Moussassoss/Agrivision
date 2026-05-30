from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from functools import lru_cache


class Settings(BaseSettings):
    # ── App ────────────────────────────────────────
    app_name: str = "Agrivision API"
    app_version: str = "1.0.0"
    debug: bool = False
    allowed_origins: list[str] = ["http://localhost:3000", "http://localhost:8081"]

    # ── Security ───────────────────────────────────
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 days

    # ── Database ───────────────────────────────────
    database_url: str

    @field_validator("database_url", mode="before")
    @classmethod
    def fix_database_url(cls, v: str) -> str:
        """Convert Render's postgres:// / postgresql:// to postgresql+asyncpg://."""
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        if v.startswith("postgresql://") and "+asyncpg" not in v:
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # ── iSDAsoil ───────────────────────────────────
    isda_username: str
    isda_password: str
    isda_base_url: str = "https://api.isda-africa.com"

    # ── OpenWeather ────────────────────────────────
    openweather_api_key: str
    openweather_base_url: str = "https://api.openweathermap.org/data/2.5"

    # ── NASA POWER ─────────────────────────────────
    nasa_power_base_url: str = "https://power.larc.nasa.gov/api/temporal/climatology/point"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance — only reads .env once."""
    return Settings()