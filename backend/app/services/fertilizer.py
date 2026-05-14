"""
Agronomic fertilizer recommendations based on soil NPK levels.
Rules sourced from Rwanda MINAGRI guidelines and standard tropical agronomy.
"""

# Target NPK ranges per crop (mg/kg soil)
CROP_NPK_TARGETS = {
    # High N-demand cereals / cash crops
    "rice":        {"N": (20, 50), "P": (10, 25), "K": (100, 180)},
    "maize":       {"N": (30, 60), "P": (15, 30), "K": (120, 200)},
    "cotton":      {"N": (30, 60), "P": (15, 30), "K": (100, 180)},
    "jute":        {"N": (30, 60), "P": (15, 25), "K": (100, 180)},
    # Legumes — fix their own N, lower N targets
    "chickpea":    {"N": (5, 20),  "P": (10, 25), "K": (80, 150)},
    "kidneybeans": {"N": (5, 20),  "P": (10, 25), "K": (80, 150)},
    "pigeonpeas":  {"N": (5, 20),  "P": (10, 25), "K": (80, 150)},
    "mothbeans":   {"N": (5, 20),  "P": (10, 25), "K": (80, 150)},
    "mungbean":    {"N": (5, 20),  "P": (10, 25), "K": (80, 150)},
    "blackgram":   {"N": (5, 20),  "P": (10, 25), "K": (80, 150)},
    "lentil":      {"N": (5, 20),  "P": (10, 25), "K": (80, 150)},
    # Fruits / perennials
    "banana":      {"N": (30, 60), "P": (10, 20), "K": (150, 250)},
    "coffee":      {"N": (25, 50), "P": (10, 20), "K": (120, 200)},
    "mango":       {"N": (20, 40), "P": (10, 20), "K": (100, 180)},
    "papaya":      {"N": (25, 50), "P": (10, 20), "K": (120, 200)},
    "orange":      {"N": (20, 40), "P": (10, 20), "K": (100, 200)},
    "pomegranate": {"N": (20, 40), "P": (10, 20), "K": (100, 180)},
    "coconut":     {"N": (20, 40), "P": (10, 20), "K": (150, 250)},
    "apple":       {"N": (20, 40), "P": (10, 20), "K": (100, 180)},
    "grapes":      {"N": (15, 30), "P": (10, 20), "K": (120, 200)},
    # Cucurbits / melons
    "watermelon":  {"N": (20, 40), "P": (10, 20), "K": (100, 180)},
    "muskmelon":   {"N": (20, 40), "P": (10, 20), "K": (100, 180)},
}

LEGUMES = {
    "chickpea", "kidneybeans", "pigeonpeas",
    "mothbeans", "mungbean", "blackgram", "lentil",
}

DEFAULT_TARGET = {"N": (20, 40), "P": (10, 25), "K": (100, 180)}


def _nitrogen_advice(soil_n: float, target: dict, is_legume: bool, lang: str) -> str:
    if is_legume:
        return (
            "Nitrogen: inoculate seeds with Rhizobium — this crop fixes its own nitrogen"
            if lang == "en" else
            "Azote: shyira ingungu za Rhizobium ku mbuto — igihingwa gikora azote cyacyo"
        )
    n_min, n_opt = target["N"]
    if soil_n < n_min:
        return (
            f"Apply 100 kg/ha of Urea (46% N) — nitrogen is critically low ({soil_n:.0f} mg/kg)"
            if lang == "en" else
            f"Shyira kg 100/ha ya Urea (46% N) — azote ni nke cyane ({soil_n:.0f} mg/kg)"
        )
    if soil_n < n_opt:
        return (
            f"Apply 50 kg/ha of Urea — moderate nitrogen deficiency ({soil_n:.0f} mg/kg)"
            if lang == "en" else
            f"Shyira kg 50/ha ya Urea — azote irimo nke ({soil_n:.0f} mg/kg)"
        )
    return (
        f"Nitrogen adequate ({soil_n:.0f} mg/kg) — no nitrogen fertilizer needed"
        if lang == "en" else
        f"Azote irahuye ({soil_n:.0f} mg/kg) — nta mfashanabyo y'azote bisabwa"
    )


def _phosphorus_advice(soil_p: float, target: dict, lang: str) -> str:
    p_min, p_opt = target["P"]
    if soil_p < p_min:
        return (
            f"Apply 50 kg/ha of DAP (18-46-0) — phosphorus is critically low ({soil_p:.0f} mg/kg)"
            if lang == "en" else
            f"Shyira kg 50/ha ya DAP (18-46-0) — fosifor ni nke cyane ({soil_p:.0f} mg/kg)"
        )
    if soil_p < p_opt:
        return (
            f"Apply 25 kg/ha of DAP — moderate phosphorus deficiency ({soil_p:.0f} mg/kg)"
            if lang == "en" else
            f"Shyira kg 25/ha ya DAP — fosifor irimo nke ({soil_p:.0f} mg/kg)"
        )
    return (
        f"Phosphorus adequate ({soil_p:.0f} mg/kg) — no phosphorus fertilizer needed"
        if lang == "en" else
        f"Fosifor irahuye ({soil_p:.0f} mg/kg) — nta mfashanabyo ya fosifor bisabwa"
    )


def _potassium_advice(soil_k: float, target: dict, lang: str) -> str:
    k_min, k_opt = target["K"]
    if soil_k < k_min:
        return (
            f"Apply 60 kg/ha of MOP (0-0-60) — potassium is low ({soil_k:.0f} mg/kg)"
            if lang == "en" else
            f"Shyira kg 60/ha ya MOP (0-0-60) — potasiyumu ni nke ({soil_k:.0f} mg/kg)"
        )
    if soil_k < k_opt:
        return (
            f"Potassium moderate ({soil_k:.0f} mg/kg) — optional: 30 kg/ha MOP"
            if lang == "en" else
            f"Potasiyumu irimo ({soil_k:.0f} mg/kg) — bishobora: kg 30/ha ya MOP"
        )
    return (
        f"Potassium adequate ({soil_k:.0f} mg/kg) — no potassium fertilizer needed"
        if lang == "en" else
        f"Potasiyumu irahuye ({soil_k:.0f} mg/kg) — nta mfashanabyo ya potasiyumu bisabwa"
    )


def get_fertilizer_advice(
    crop: str,
    soil_n: float,
    soil_p: float,
    soil_k: float,
    lang: str = "en",
) -> dict:
    """
    Return fertilizer recommendations for a crop given current soil NPK values.
    Doses follow Rwanda MINAGRI standard recommendations (kg/ha).
    """
    target = CROP_NPK_TARGETS.get(crop, DEFAULT_TARGET)
    is_legume = crop in LEGUMES

    items = [
        _nitrogen_advice(soil_n, target, is_legume, lang),
        _phosphorus_advice(soil_p, target, lang),
        _potassium_advice(soil_k, target, lang),
    ]

    note = (
        "Apply in split doses: half at planting, half 4–6 weeks after emergence. "
        "Always consult a local agronomist for field-specific adjustments."
        if lang == "en" else
        "Shyira mu bice bibiri: igice kimwe igihe utera, ikindi nyuma y'ibyumweru 4–6. "
        "Baza inzobere y'ubuhinzi ku birebana n'umusozi wawe."
    )

    return {"items": items, "note": note}
