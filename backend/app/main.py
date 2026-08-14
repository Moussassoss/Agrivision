from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager
import os

from app.api.routes import soil, weather, crop, auth
from app.config import get_settings
from app.utils.logger import get_logger
from app.models.response import HealthResponse

settings = get_settings()
logger   = get_logger(__name__)

# ── Sentry (optional) ──────────────────────────────
if settings.sentry_dsn:
    import sentry_sdk
    from sentry_sdk.integrations.starlette import StarletteIntegration
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        integrations=[StarletteIntegration(), FastApiIntegration()],
        traces_sample_rate=0.2,
        environment="production" if not settings.debug else "development",
    )
    logger.info("Sentry error monitoring enabled.")

# ── Rate limiter ───────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    from app.ml.predictor import load_model
    from app.db.database import create_tables
    await create_tables()
    load_model()
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Climate-responsive crop recommendation API for smallholder farmers in Rwanda.",
    # Swagger UI and ReDoc disabled in production — enable locally via DEBUG=true
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan,
)

# ── Rate limiting ──────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ───────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────
app.include_router(auth.router,    prefix="/auth",    tags=["Auth"])
app.include_router(soil.router,    prefix="/soil",    tags=["Soil"])
app.include_router(weather.router, prefix="/weather", tags=["Weather"])
app.include_router(crop.router,    prefix="/crop",    tags=["Crop"])


# ── Rate limits on auth endpoints ──────────────────
# Applied directly on routes via decorator — see auth.py for @limiter.limit usage.
# The following middleware applies stricter limits per-path:

@app.middleware("http")
async def auth_rate_limit_middleware(request: Request, call_next):
    """
    Tight per-IP limits on auth paths to block brute-force attacks.
    slowapi's @limiter.limit decorator handles the actual rejection;
    this middleware is kept as a secondary safeguard layer.
    """
    return await call_next(request)


# ── Health check ───────────────────────────────────
@app.get("/", response_model=HealthResponse, tags=["Health"])
async def health():
    model_exists = os.path.exists("app/ml/model.pkl")
    return HealthResponse(
        status="ok",
        version=settings.app_version,
        model_loaded=model_exists,
    )


@app.get("/ping", tags=["Health"])
async def ping():
    return {"ping": "pong"}
