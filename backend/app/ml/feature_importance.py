import joblib
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import os

# ── 1. Load your model ───────────────────────────────────────────────────────
# Update this path to where your model.pkl is located
MODEL_PATH = "model.pkl"  # or "cropvana_rwanda_model_v2.pkl"

bundle = joblib.load(MODEL_PATH)
rf      = bundle["model"]
scaler  = bundle["scaler"]
encoder = bundle["encoder"]

# ── 2. Extract feature importances ──────────────────────────────────────────
feature_labels = [
    "Nitrogen (N)",
    "Phosphorus (P)",
    "Potassium (K)",
    "Temperature",
    "Humidity",
    "Soil pH",
    "Rainfall"
]

importances = rf.feature_importances_

# Sort descending
sorted_idx   = np.argsort(importances)[::-1]
features_sorted     = [feature_labels[i] for i in sorted_idx]
importances_sorted  = [importances[i]     for i in sorted_idx]

# Print to console so you can verify
print("=" * 45)
print("  Feature Importance Rankings")
print("=" * 45)
for f, imp in zip(features_sorted, importances_sorted):
    bar = "█" * int(imp * 200)
    print(f"  {f:<18}: {imp*100:.2f}%  {bar}")
print("=" * 45)
print(f"  Total: {sum(importances_sorted)*100:.2f}%")
print(f"  Crops : {len(encoder.classes_)}")
print(f"  Classes: {list(encoder.classes_)}")

# ── 3. Color mapping by feature category ────────────────────────────────────
color_map = {
    "Rainfall":       "#1F6E43",   # dark green  — climate
    "Humidity":       "#2E8B57",   # medium green — climate
    "Temperature":    "#4CAF7D",   # light green  — climate
    "Nitrogen (N)":   "#065A82",   # dark blue    — soil nutrient
    "Phosphorus (P)": "#0A7AAA",   # medium blue  — soil nutrient
    "Potassium (K)":  "#1199CC",   # light blue   — soil nutrient
    "Soil pH":        "#B45309",   # amber        — soil chemistry
}
bar_colors = [color_map[f] for f in features_sorted]

# ── 4. Plot ──────────────────────────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(10, 6))
fig.patch.set_facecolor("white")
ax.set_facecolor("white")

# Horizontal bar chart (features reversed so highest is at the top)
bars = ax.barh(
    features_sorted[::-1],
    [i * 100 for i in importances_sorted[::-1]],
    color=bar_colors[::-1],
    edgecolor="white",
    height=0.62,
    linewidth=0.8
)

# Value labels at end of each bar
for bar, val in zip(bars, [i * 100 for i in importances_sorted[::-1]]):
    ax.text(
        bar.get_width() + 0.3,
        bar.get_y() + bar.get_height() / 2,
        f"{val:.1f}%",
        va="center", ha="left",
        fontsize=11, fontweight="bold",
        color="#1A1A1A"
    )

# ── 5. Styling ───────────────────────────────────────────────────────────────
ax.set_xlabel("Feature Importance (%)", fontsize=11, color="#333333", labelpad=8)
ax.set_title(
    "Figure 4.X: Random Forest Feature Importance Rankings\n"
    f"(Rwanda-Augmented Dataset · {len(encoder.classes_)} Crops · n=2,100)",
    fontsize=12, fontweight="bold", color="#1A1A1A", pad=12
)

ax.set_xlim(0, max(i * 100 for i in importances_sorted) * 1.20)
ax.tick_params(axis="y", labelsize=11,  colors="#1A1A1A")
ax.tick_params(axis="x", labelsize=9.5, colors="#555555")

ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)
ax.spines["left"].set_color("#CCCCCC")
ax.spines["bottom"].set_color("#CCCCCC")
ax.grid(axis="x", linestyle="--", alpha=0.4, color="#AAAAAA")
ax.set_axisbelow(True)

# Legend
legend_patches = [
    mpatches.Patch(color="#1F6E43", label="Climate variables (Rainfall, Humidity, Temperature)"),
    mpatches.Patch(color="#065A82", label="Soil nutrient variables (N, P, K)"),
    mpatches.Patch(color="#B45309", label="Soil chemistry (pH)"),
]
ax.legend(
    handles=legend_patches,
    loc="lower right",
    fontsize=9,
    framealpha=0.9,
    edgecolor="#CCCCCC"
)

plt.tight_layout(pad=1.5)

# ── 6. Save + Show ───────────────────────────────────────────────────────────
output_path = "feature_importance_chart.png"
plt.savefig(output_path, dpi=200, bbox_inches="tight", facecolor="white")
print(f"\nChart saved → {output_path}")

plt.show()