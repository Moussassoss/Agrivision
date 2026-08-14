# CropVana 🌱

> AI-powered crop recommendation system for smallholder farmers in Rwanda

[![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React Native](https://img.shields.io/badge/React_Native-Expo_54-61DAFB?logo=react&logoColor=black)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.8-F7931E?logo=scikitlearn&logoColor=white)](https://scikit-learn.org)
[![Deployed on Render](https://img.shields.io/badge/Deployed-Render-46E3B7?logo=render&logoColor=white)](https://render.com)

---

## Overview

CropVana helps smallholder farmers in Rwanda decide **which crops to plant** by combining three real-time data sources with a machine learning model:

1. **Satellite soil data** (iSDAsoil) — nitrogen, phosphorus, potassium, pH at 30 m resolution
2. **Live weather** (OpenWeather + NASA POWER) — temperature, humidity, 10-year rainfall average
3. **RandomForest ML model** — trained on Rwanda-calibrated agronomic data, 98.1% accuracy, 21 crop classes

The farmer opens the app, taps Scan, and within seconds receives the **top 3 recommended crops** for their exact field location — ranked by confidence — along with planting instructions and fertilizer advice. The full experience is available in **English and Kinyarwanda**.

---

## Demo Screenshots

| Onboarding | Home | Results | Planting Guide |
|:-----------:|:----:|:-------:|:--------------:|
| *(first-launch slides)* | *(GPS scan)* | *(top 3 crops + confidence)* | *(step-by-step guide)* |

---

## Technical Highlights

### Machine Learning Pipeline

```
Raw GPS coordinates
        │
        ├─► iSDAsoil API  ──────► N, P, K, pH (satellite-derived)
        │                          │  unit calibration layer
        ├─► OpenWeather API ──────► Temperature, Humidity
        │                          │
        └─► NASA POWER API ───────► 10-year avg Rainfall
                                   │
                            StandardScaler (z-score normalisation)
                                   │
                         RandomForestClassifier
                           (100 trees, 21 classes)
                                   │
                            Top-3 predictions
                           with confidence scores
                                   │
                     Planting calendar + fertilizer advice
```

**Key engineering challenge:** iSDAsoil returns soil measurements in real physical units (g/kg total nitrogen, mg/kg Mehlich-3 phosphorus) while the training dataset uses dimensionless agronomic indices. A unit calibration layer with empirically derived scale factors bridges the two systems, bringing predictions from <50% confidence to >75%.

### Backend (FastAPI)

- Async-first: `asyncpg` + SQLAlchemy 2 async sessions throughout
- JWT authentication with `bcrypt` password hashing
- In-memory TTL cache (soil: 24 h, weather: 1 h) to avoid redundant API calls
- Pydantic v2 `field_validator` for automatic Render `postgres://` → `postgresql+asyncpg://` URL rewriting
- `asyncio.gather` for concurrent iSDAsoil + OpenWeather + NASA POWER fetches per request
- Deployed on Render with auto-SSL, managed PostgreSQL, and deploy-on-push CI

### Mobile App (React Native / Expo)

- Conditional navigation guard: onboarding → auth → home (correct state machine, no flicker)
- `expo-secure-store` for JWT token (OS Keychain/Keystore, not AsyncStorage)
- Full dark mode via React Context, persisted to AsyncStorage
- Location permission denial detection + deep link to device Settings via `Linking.openSettings()`
- i18next integration with English and Kinyarwanda, runtime language switching without app restart
- Skeleton loaders, planting animations, share-to-clipboard functionality

---

## Repository Structure

```
Agrivision/
├── backend/          # FastAPI + PostgreSQL + ML
│   ├── app/
│   │   ├── api/      # REST endpoints (auth, soil, weather, crop)
│   │   ├── ml/       # RandomForest training + inference
│   │   ├── services/ # iSDAsoil, OpenWeather, NASA POWER clients
│   │   └── db/       # SQLAlchemy models + migrations
│   ├── render.yaml   # One-click Render deploy blueprint
│   └── README.md
├── mobile/           # React Native / Expo
│   ├── src/
│   │   ├── screens/  # 11 screens
│   │   ├── context/  # Auth, Theme, Language, Onboarding
│   │   └── i18n/     # en.json, rw.json
│   ├── app.json      # Expo + App Store metadata
│   ├── eas.json      # EAS Build configuration
│   └── README.md
└── docs/
    ├── privacy-policy.html    # Apple-required privacy policy
    └── terms-of-service.html  # Terms & conditions
```

---

## Getting Started

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your API keys
python -m app.ml.train # train the model
uvicorn app.main:app --reload
# API docs at http://localhost:8000/docs
```

### Mobile

```bash
cd mobile
npm install
npx expo start
# Scan with Expo Go or press i/a for simulator
```

Full setup instructions: [backend/README.md](backend/README.md) · [mobile/README.md](mobile/README.md)

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Create farmer account |
| `POST` | `/auth/login` | — | Login → JWT token |
| `POST` | `/crop` | JWT | AI crop recommendation for GPS location |
| `GET` | `/crop/history` | JWT | Past recommendations |
| `GET` | `/soil` | — | Raw iSDAsoil data |
| `GET` | `/weather` | — | Current weather + rainfall average |

Live API docs (when deployed): `https://your-render-url.onrender.com/docs`

---

## Supported Crops

21 crops calibrated for Rwandan growing conditions:

🌾 Rice · 🌽 Maize · 🫘 Kidney Beans · 🫘 Black Gram · 🌿 Lentil · 🍌 Banana · 🥭 Mango · 🍉 Watermelon · 🍊 Orange · 🍈 Papaya · 🥥 Coconut · ☕ Coffee · 🥑 Avocado · 🌿 Cassava · 🥔 Potato · 🌾 Sorghum · 🫘 Soybean · 🍠 Sweet Potato · 🍵 Tea · 🍅 Tomato · 🌾 Wheat

---

## Model Performance

| Metric | Value |
|---|---|
| Algorithm | RandomForestClassifier |
| Trees | 100 |
| Test accuracy | **98.1%** |
| Classes | 21 crops |
| Feature count | 7 |
| Training set | Rwanda-calibrated agronomic dataset |

---

## Privacy & Legal

- [Privacy Policy](docs/privacy-policy.html)
- [Terms of Service](docs/terms-of-service.html)

Data collected: email, name (account); GPS coordinates (per recommendation, used only to fetch soil/weather). No advertising, no third-party analytics. See Privacy Policy for full details.

---

## Author

**Moussassoss** — [github.com/Moussassoss](https://github.com/Moussassoss) · [hamatguire@gmail.com](mailto:hamatguire@gmail.com)

---

## License

This project is for academic and portfolio purposes. The ML model and training data are not licensed for commercial redistribution.
