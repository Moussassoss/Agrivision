from app.utils.logger import get_logger

logger = get_logger(__name__)

# ── Planting calendar for Rwanda ────────────────────
# Season A: September – February
# Season B: March – June
PLANTING_CALENDAR = {
    "rice":         "Season A (Sep–Feb) — needs flooded fields",
    "maize":        "Season A or B — plant at start of rains",
    "chickpea":     "Season B (Mar–Jun) — dry spell tolerant",
    "kidneybeans":  "Season A or B — well-drained soils",
    "pigeonpeas":   "Season A (Sep–Feb) — drought tolerant",
    "mothbeans":    "Season B (Mar–Jun) — dry conditions",
    "mungbean":     "Season B (Mar–Jun) — short growing cycle",
    "blackgram":    "Season B (Mar–Jun) — warm and dry",
    "lentil":       "Season A (Sep–Feb) — cool temperatures",
    "pomegranate":  "Plant year-round — fruit in 5–7 months",
    "banana":       "Plant year-round — harvest in 9–12 months",
    "mango":        "Plant at start of rains — fruit in 3–5 years",
    "grapes":       "Plant in dry season — prune after harvest",
    "watermelon":   "Season B (Mar–Jun) — needs warm dry weather",
    "muskmelon":    "Season B (Mar–Jun) — warm and sunny",
    "apple":        "Plant in cool season — needs highland climate",
    "orange":       "Plant year-round — fruit in 3–5 years",
    "papaya":       "Plant year-round — fruit in 6–9 months",
    "coconut":      "Plant year-round — needs coastal/lowland area",
    "cotton":       "Season A (Sep–Feb) — needs long dry spell",
    "jute":         "Season A (Sep–Feb) — needs high humidity",
    "coffee":       "Plant year-round — Rwanda highlands ideal",
}

# ── Why this crop fits ──────────────────────────────
def _build_reason(crop: str, soil: dict, weather: dict) -> str:
    """Generate a short agronomic explanation for the recommendation."""
    reasons = []

    ph = soil["ph"]
    n  = soil["nitrogen"]
    p  = soil["phosphorus"]
    k  = soil["potassium"]
    temp     = weather["temperature"]
    humidity = weather["humidity"]
    rainfall = weather["rainfall"]

    # pH insight
    if ph < 5.5:
        reasons.append(f"soil is acidic (pH {ph}) — consider liming before planting")
    elif ph > 7.5:
        reasons.append(f"soil is alkaline (pH {ph}) — sulfur amendment may help")
    else:
        reasons.append(f"soil pH {ph} is suitable")

    # Nutrient insight
    if n < 10:
        reasons.append("nitrogen is low — apply nitrogen-rich fertilizer")
    if p < 15:
        reasons.append("phosphorus is low — apply DAP or TSP")
    if k < 100:
        reasons.append("potassium is moderate — potash fertilizer optional")

    # Climate insight
    if rainfall > 1500:
        reasons.append(f"high rainfall ({rainfall:.0f}mm) suits water-loving crops")
    elif rainfall < 600:
        reasons.append(f"low rainfall ({rainfall:.0f}mm) — drought-tolerant crop selected")
    else:
        reasons.append(f"rainfall ({rainfall:.0f}mm/yr) is adequate")

    if temp < 15:
        reasons.append(f"cool temperature ({temp:.1f}°C) favors highland crops")
    elif temp > 30:
        reasons.append(f"high temperature ({temp:.1f}°C) suits tropical crops")

    return ". ".join(reasons[:3]).capitalize() + "."


def build_recommendations(
    predictions: list[dict],
    soil: dict,
    weather: dict,
) -> list[dict]:
    """
    Enrich raw ML predictions with planting calendar and agronomic reasons.

    Args:
        predictions: [{"crop": "maize", "confidence": 0.95}, ...]
        soil:        soil dict from iSDAsoil service
        weather:     weather dict from weather service

    Returns:
        [
            {
                "crop": "maize",
                "confidence": 0.95,
                "planting_season": "Season A or B...",
                "why": "Soil pH 6.2 is suitable. Rainfall adequate..."
            },
            ...
        ]
    """
    results = []
    for pred in predictions:
        crop = pred["crop"]
        results.append({
            "crop":            crop,
            "confidence":      pred["confidence"],
            "planting_season": PLANTING_CALENDAR.get(crop, "Consult local agronomist"),
            "why":             _build_reason(crop, soil, weather),
        })
    return results