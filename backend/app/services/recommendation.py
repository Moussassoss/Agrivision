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

PLANTING_CALENDAR_RW = {
    "rice":         "Igihembwe A (Nzeli–Gashyantare) — bisaba imirima ifuye",
    "maize":        "Igihembwe A cyangwa B — tera mu ntangiriro y'imvura",
    "chickpea":     "Igihembwe B (Werurwe–Kamena) — birhanganira ubusumo",
    "kidneybeans":  "Igihembwe A cyangwa B — ubutaka bufite utuzimu bwiza",
    "pigeonpeas":   "Igihembwe A (Nzeli–Gashyantare) — birhanganira ubuche",
    "mothbeans":    "Igihembwe B (Werurwe–Kamena) — bisabwa imvura nke",
    "mungbean":     "Igihembwe B (Werurwe–Kamena) — bigura vuba",
    "blackgram":    "Igihembwe B (Werurwe–Kamena) — bisaba ubushyuhe n'ubusumo",
    "lentil":       "Igihembwe A (Nzeli–Gashyantare) — bisaba ubushyuhe buto",
    "pomegranate":  "Biba mu mwaka wose — kimera nyuma y'amezi 5–7",
    "banana":       "Biba mu mwaka wose — vuna nyuma y'amezi 9–12",
    "mango":        "Tera mu ntangiriro y'imvura — kimera nyuma y'imyaka 3–5",
    "grapes":       "Tera mu gihe cy'ubusumo — tema nyuma yo gusarura",
    "watermelon":   "Igihembwe B (Werurwe–Kamena) — bisaba ubushyuhe n'ubusumo",
    "muskmelon":    "Igihembwe B (Werurwe–Kamena) — bisaba izuba ryinshi",
    "apple":        "Tera mu gihe cy'ubushyuhe buto — bisaba klimati y'umusozi",
    "orange":       "Biba mu mwaka wose — kimera nyuma y'imyaka 3–5",
    "papaya":       "Biba mu mwaka wose — kimera nyuma y'amezi 6–9",
    "coconut":      "Biba mu mwaka wose — bisaba akarere k'inyanja",
    "cotton":       "Igihembwe A (Nzeli–Gashyantare) — bisaba gihe kirekire cy'ubusumo",
    "jute":         "Igihembwe A (Nzeli–Gashyantare) — bisaba ubuhehere bwinshi",
    "coffee":       "Biba mu mwaka wose — imisozi y'u Rwanda ikunzwe",
}


def _build_reason(crop: str, soil: dict, weather: dict, lang: str = "en") -> str:
    """Generate a short agronomic explanation for the recommendation."""
    ph       = soil["ph"]
    n        = soil["nitrogen"]
    p        = soil["phosphorus"]
    k        = soil["potassium"]
    temp     = weather["temperature"]
    rainfall = weather["rainfall"]

    if lang == "rw":
        reasons = []
        if ph < 5.5:
            reasons.append(f"ubutaka bufite acid (pH {ph}) — kongera lime mbere yo gutera")
        elif ph > 7.5:
            reasons.append(f"ubutaka bufite alkaline (pH {ph}) — sulphur irashobora gufasha")
        else:
            reasons.append(f"pH y'ubutaka {ph} iri neza ku gihingwa")

        if n < 10:
            reasons.append("azote ni nke — shyira umote w'azote")
        if p < 15:
            reasons.append("fosifor ni nke — shyira DAP cyangwa TSP")
        if k < 100:
            reasons.append("potasiyumu iri mu rugero — umote wa potash ntibisabwa cyane")

        if rainfall > 1500:
            reasons.append(f"imvura nyinshi ({rainfall:.0f} mm) ikunda ibihingwa bisaba amazi menshi")
        elif rainfall < 600:
            reasons.append(f"imvura nke ({rainfall:.0f} mm) — igihingwa kirhanganira ubuche cyatoranijwe")
        else:
            reasons.append(f"imvura ({rainfall:.0f} mm/mwaka) iri neza")

        if temp < 15:
            reasons.append(f"ubushyuhe buto ({temp:.1f}°C) bukunda ibihingwa by'umusozi")
        elif temp > 30:
            reasons.append(f"ubushyuhe bwinshi ({temp:.1f}°C) bukunda ibihingwa bya tropique")
    else:
        reasons = []
        if ph < 5.5:
            reasons.append(f"soil is acidic (pH {ph}) — consider liming before planting")
        elif ph > 7.5:
            reasons.append(f"soil is alkaline (pH {ph}) — sulfur amendment may help")
        else:
            reasons.append(f"soil pH {ph} is suitable")

        if n < 10:
            reasons.append("nitrogen is low — apply nitrogen-rich fertilizer")
        if p < 15:
            reasons.append("phosphorus is low — apply DAP or TSP")
        if k < 100:
            reasons.append("potassium is moderate — potash fertilizer optional")

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
    lang: str = "en",
) -> list[dict]:
    """
    Enrich raw ML predictions with planting calendar and agronomic reasons.
    Supports 'en' (English) and 'rw' (Kinyarwanda) via the lang parameter.
    """
    calendar = PLANTING_CALENDAR_RW if lang == "rw" else PLANTING_CALENDAR
    results = []
    for pred in predictions:
        crop = pred["crop"]
        results.append({
            "crop":            crop,
            "confidence":      pred["confidence"],
            "planting_season": calendar.get(crop, "Consult local agronomist"),
            "why":             _build_reason(crop, soil, weather, lang),
        })
    return results
