from fastapi import FastAPI
from app.api.routes import soil, weather, crop, auth
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from app.config import get_settings
from app.utils.logger import get_logger
from app.models.response import HealthResponse

# ── Routes (uncomment as we build each step) ───────
# from app.api.routes import soil, weather, crop, auth

settings = get_settings()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Debug mode: {settings.debug}")
    # Step 3: we will load model.pkl here
    from app.ml.predictor import load_model
    from app.db.database import create_tables
    await create_tables()
    load_model()
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Climate-responsive crop recommendation API for smallholder farmers",
    docs_url="/docs",       # Swagger UI
    redoc_url="/redoc",     # ReDoc UI
    lifespan=lifespan,
)

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