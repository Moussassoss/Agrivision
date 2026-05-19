import pandas as pd
import numpy as np
import joblib
import json
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report, accuracy_score

# ── Paths ───────────────────────────────────────────
BASE_DIR   = Path(__file__).parent
DATA_PATH  = BASE_DIR.parent.parent / "data" / "Cropvana_Rwanda_Dataset_v2.xlsx"  # ← changed
MODEL_PATH = BASE_DIR / "model.pkl"
META_PATH  = BASE_DIR / "model_meta.json"


def train():
    print("=" * 50)
    print("  Cropvana — ML Training Pipeline")                                   # ← changed
    print("=" * 50)

    # ── 1. Load data ────────────────────────────────
    print("\n[1/6] Loading dataset...")
    df = pd.read_excel(DATA_PATH, sheet_name="Cropvana_Rwanda_Dataset")          # ← changed
    print(f"      Rows: {len(df)} | Crops: {df['Crop Label'].nunique()}")        # ← changed

    # ── 2. Features & target ────────────────────────
    print("\n[2/6] Preparing features...")
    FEATURES = ['N (mg/kg)', 'P (mg/kg)', 'K (mg/kg)',                          # ← changed
                'Temperature (°C)', 'Humidity (%)', 'pH', 'Rainfall (mm)']      # ← changed
    X = df[FEATURES]
    y = df['Crop Label']                                                          # ← changed

    # Encode crop labels to integers
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    print(f"      Features : {FEATURES}")
    print(f"      Classes  : {list(le.classes_)}")

    # ── 3. Scale features ───────────────────────────
    print("\n[3/6] Scaling features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # ── 4. Train / test split ───────────────────────
    print("\n[4/6] Splitting data (80% train / 20% test)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y_encoded,
        test_size=0.2,
        random_state=42,
        stratify=y_encoded,
    )
    print(f"      Train: {len(X_train)} | Test: {len(X_test)}")

    # ── 5. Train model ──────────────────────────────
    print("\n[5/6] Training Random Forest...")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        min_samples_split=2,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    # ── 6. Evaluate ─────────────────────────────────
    print("\n[6/6] Evaluating model...")
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n      Test accuracy : {acc * 100:.2f}%")

    cv_scores = cross_val_score(model, X_scaled, y_encoded, cv=5)
    print(f"      CV accuracy  : {cv_scores.mean() * 100:.2f}% "
          f"(+/- {cv_scores.std() * 100:.2f}%)")

    print("\n      Per-crop report:")
    print(classification_report(
        y_test, y_pred,
        target_names=le.classes_
    ))

    importances = dict(zip(FEATURES, model.feature_importances_.round(4).tolist()))
    print("      Feature importances:")
    for feat, imp in sorted(importances.items(), key=lambda x: -x[1]):
        bar = "█" * int(imp * 40)
        print(f"        {feat:<20} {bar} {imp:.4f}")                             # ← wider spacing

    # ── Save model + metadata ────────────────────────
    print("\n Saving model...")
    bundle = {
        "model"  : model,
        "scaler" : scaler,
        "encoder": le,
    }
    joblib.dump(bundle, MODEL_PATH)

    meta = {
        "features"    : FEATURES,
        "crops"       : list(le.classes_),
        "accuracy"    : round(acc, 4),
        "cv_mean"     : round(cv_scores.mean(), 4),
        "cv_std"      : round(cv_scores.std(), 4),
        "n_estimators": 200,
        "train_rows"  : len(X_train),
        "test_rows"   : len(X_test),
    }
    META_PATH.write_text(json.dumps(meta, indent=2))

    print(f"\n Model saved  → {MODEL_PATH}")
    print(f" Metadata     → {META_PATH}")
    print(f"\n Done! Accuracy: {acc * 100:.2f}%")
    print("=" * 50)


if __name__ == "__main__":
    train()