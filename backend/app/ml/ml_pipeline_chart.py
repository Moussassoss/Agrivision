import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.patheffects as pe
import numpy as np

# ── Data ─────────────────────────────────────────────────────────────────────
steps = [
    {
        "title":    "Input Data",
        "subtitle": "7 Features",
        "details":  ["N (mg/kg)", "P (mg/kg)", "K (mg/kg)",
                     "Temperature (°C)", "Humidity (%)",
                     "Soil pH", "Rainfall (mm)"],
        "color":    "#1F6E43",
        "light":    "#D6EAD8",
    },
    {
        "title":    "StandardScaler",
        "subtitle": "Preprocessing",
        "details":  ["Subtract mean",
                     "Divide by std dev",
                     "Fit on train set",
                     "Apply to test set",
                     "Prevents scale bias"],
        "color":    "#065A82",
        "light":    "#D0E8F5",
    },
    {
        "title":    "Random Forest",
        "subtitle": "200 Trees",
        "details":  ["Bootstrap sampling",
                     "Random feature split",
                     "Majority vote",
                     "98.10% accuracy",
                     "5-CV: 97.24%"],
        "color":    "#B45309",
        "light":    "#FDE8C8",
    },
    {
        "title":    "LabelEncoder",
        "subtitle": "Decode Output",
        "details":  ["Integer → Crop name",
                     "21 classes (0–20)",
                     "Alphabetical order",
                     "Inverse transform",
                     "At inference time"],
        "color":    "#6B21A8",
        "light":    "#EDE4FF",
    },
    {
        "title":    "Top 3 Crops",
        "subtitle": "Final Output",
        "details":  ["Ranked by confidence",
                     "Confidence scores (%)",
                     "Planting calendar",
                     "Agronomic guidance",
                     "Knowledge base lookup"],
        "color":    "#1F6E43",
        "light":    "#D6EAD8",
    },
]

# ── Canvas ────────────────────────────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(16, 7))
fig.patch.set_facecolor("white")
ax.set_facecolor("white")
ax.set_xlim(0, 16)
ax.set_ylim(0, 7)
ax.axis("off")

# ── Title ─────────────────────────────────────────────────────────────────────
ax.text(8, 6.65, "Figure 4.X: CropVana Machine Learning Pipeline",
        ha="center", va="center", fontsize=14, fontweight="bold", color="#1A1A1A")
ax.text(8, 6.28, "From raw environmental inputs to crop recommendation output",
        ha="center", va="center", fontsize=10, color="#666666", style="italic")

# ── Box dimensions ────────────────────────────────────────────────────────────
BOX_W  = 2.4
BOX_H  = 4.8
GAP    = 0.52
START_X = (16 - (len(steps) * BOX_W + (len(steps) - 1) * GAP)) / 2
Y_TOP  = 5.8

for i, step in enumerate(steps):
    x = START_X + i * (BOX_W + GAP)
    y_bottom = Y_TOP - BOX_H

    # ── Shadow ────────────────────────────────────────────────────────────────
    shadow = plt.Rectangle((x + 0.06, y_bottom - 0.06),
                            BOX_W, BOX_H,
                            facecolor="#DDDDDD", linewidth=0,
                            zorder=1)
    ax.add_patch(shadow)

    # ── Main box ──────────────────────────────────────────────────────────────
    box = plt.Rectangle((x, y_bottom), BOX_W, BOX_H,
                         facecolor=step["light"],
                         edgecolor=step["color"],
                         linewidth=2.0, zorder=2)
    ax.add_patch(box)

    # ── Colored header bar ────────────────────────────────────────────────────
    header = plt.Rectangle((x, Y_TOP - 1.05), BOX_W, 1.05,
                            facecolor=step["color"],
                            linewidth=0, zorder=3)
    ax.add_patch(header)

    # Step number badge
    badge = plt.Circle((x + 0.32, Y_TOP - 0.52), 0.22,
                        facecolor="white", edgecolor=step["color"],
                        linewidth=1.5, zorder=4)
    ax.add_patch(badge)
    ax.text(x + 0.32, Y_TOP - 0.52, str(i + 1),
            ha="center", va="center",
            fontsize=9.5, fontweight="bold",
            color=step["color"], zorder=5)

    # Header title
    ax.text(x + BOX_W / 2 + 0.1, Y_TOP - 0.38,
            step["title"],
            ha="center", va="center",
            fontsize=11, fontweight="bold",
            color="white", zorder=5)

    # Header subtitle
    ax.text(x + BOX_W / 2 + 0.1, Y_TOP - 0.78,
            step["subtitle"],
            ha="center", va="center",
            fontsize=9, color="white",
            alpha=0.90, zorder=5)

    # ── Divider line ──────────────────────────────────────────────────────────
    ax.plot([x + 0.15, x + BOX_W - 0.15],
            [Y_TOP - 1.15, Y_TOP - 1.15],
            color=step["color"], linewidth=0.8,
            alpha=0.5, zorder=3)

    # ── Detail items ─────────────────────────────────────────────────────────
    for j, detail in enumerate(step["details"]):
        dy = Y_TOP - 1.42 - j * 0.60

        # Bullet dot
        dot = plt.Circle((x + 0.28, dy + 0.06), 0.055,
                          facecolor=step["color"],
                          linewidth=0, zorder=3)
        ax.add_patch(dot)

        ax.text(x + 0.48, dy + 0.06,
                detail,
                ha="left", va="center",
                fontsize=8.8, color="#1A1A1A",
                zorder=3)

    # ── Arrow between steps ───────────────────────────────────────────────────
    if i < len(steps) - 1:
        arrow_x = x + BOX_W + 0.04
        arrow_y = Y_TOP - BOX_H / 2 - 0.15

        ax.annotate(
            "",
            xy=(arrow_x + GAP - 0.08, arrow_y),
            xytext=(arrow_x, arrow_y),
            arrowprops=dict(
                arrowstyle="-|>",
                color="#444444",
                lw=1.8,
                mutation_scale=18,
            ),
            zorder=6
        )

# ── Bottom info bar ────────────────────────────────────────────────────────────
info_y = 0.22
ax.add_patch(plt.Rectangle((0.5, 0.08), 15, 0.55,
                             facecolor="#F4FAF6",
                             edgecolor="#C8E6D1",
                             linewidth=1.0))

info_items = [
    ("Dataset:",        "2,100 rows · 21 Rwanda crops · 100 obs/class"),
    ("Train / Test:",   "1,680 / 420  (80/20 stratified)"),
    ("Test Accuracy:",  "98.10%"),
    ("5-Fold CV:",      "97.24% ± 0.51%"),
    ("Model size:",     "model.pkl  10.49 MB"),
]

x_cursor = 0.85
for label, value in info_items:
    ax.text(x_cursor, info_y, label,
            ha="left", va="center",
            fontsize=8.5, fontweight="bold",
            color="#1F6E43")
    ax.text(x_cursor + len(label) * 0.092, info_y, f" {value}",
            ha="left", va="center",
            fontsize=8.5, color="#333333")
    x_cursor += 3.05

# ── Save & show ───────────────────────────────────────────────────────────────
plt.tight_layout(pad=0.5)
output_path = "ml_pipeline_chart.png"
plt.savefig(output_path, dpi=200, bbox_inches="tight", facecolor="white")
print(f"Saved → {output_path}")
plt.show()