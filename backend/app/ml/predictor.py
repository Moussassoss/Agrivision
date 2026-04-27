import joblib
import pandas as pd
import json
import numpy as np
from pathlib import Path
from app.utils.logger import get_logger

logger = get_logger(__name__)

# ── Paths ───────────────────────────────────────────
BASE_DIR   = Path(__file__).parent
MODEL_PATH = BASE_DIR / "model.pkl"
META_PATH  = BASE_DIR / "model_meta.json"

# ── Global bundle (loaded once at startup) ──────────
_bundle = None
_meta   = None


def load_model():
    """Load model.pkl into memory. Called once at app startup."""
    global _bundle, _meta
    if _bundle is not None:
        return  # Already loaded

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"model.pkl not found at {MODEL_PATH}. "
            "Run: python -m app.ml.train"
        )

    logger.info("Loading AgriVision ML model...")
    _bundle = joblib.load(MODEL_PATH)
    _meta   = json.loads(META_PATH.read_text())
    logger.info(
        f"Model loaded — {len(_meta['crops'])} crops | "
        f"Accuracy: {_meta['accuracy'] * 100:.1f}%"
    )


def predict(
    N: float,
    P: float,
    K: float,
    temperature: float,
    humidity: float,
    ph: float,
    rainfall: float,
    top_n: int = 3,
) -> list[dict]:
    """
    Run crop prediction and return top N crops with confidence scores.

    Returns:
        [
            {"crop": "maize", "confidence": 0.95},
            {"crop": "rice",  "confidence": 0.03},
            ...
        ]
    """
    if _bundle is None:
        load_model()

    model   = _bundle["model"]
    scaler  = _bundle["scaler"]
    encoder = _bundle["encoder"]

    # Build feature vector in the exact order the model was trained on
    features = pd.DataFrame(
        [[N, P, K, temperature, humidity, ph, rainfall]],
        columns=["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
    )
    features_scaled = scaler.transform(features)

    # Get probability for every crop class
    probabilities = model.predict_proba(features_scaled)[0]

    # Pair each crop with its confidence and sort descending
    crop_probs = [
        {"crop": encoder.classes_[i], "confidence": round(float(p), 4)}
        for i, p in enumerate(probabilities)
    ]
    crop_probs.sort(key=lambda x: -x["confidence"])

    logger.debug(f"Top prediction: {crop_probs[0]}")
    return crop_probs[:top_n]


def get_model_meta() -> dict:
    """Return model metadata (accuracy, crops list, features)."""
    if _meta is None:
        load_model()
    return _meta