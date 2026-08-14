# CropVana API

REST API backend for CropVana — an AI-powered crop recommendation system for smallholder farmers in Rwanda.

Built with **FastAPI** · **PostgreSQL** · **scikit-learn** · **iSDAsoil** · **OpenWeather**

---

## Architecture

```
mobile app (React Native)
        │  HTTPS + JWT
        ▼
   FastAPI (Render)
   ┌─────────────────────────────┐
   │  /auth   — register / login │
   │  /soil   — iSDAsoil data    │
   │  /weather— OpenWeather+NASA │
   │  /crop   — ML recommendation│
   └──────────┬──────────────────┘
              │
     ┌────────┴────────┐
     │                 │
PostgreSQL        RandomForest
(Render DB)     model.pkl (sklearn)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI 0.136 + Uvicorn |
| Database | PostgreSQL via asyncpg + SQLAlchemy 2 (async) |
| Auth | JWT (python-jose) + bcrypt 5 |
| ML | scikit-learn 1.8 — RandomForestClassifier |
| Soil data | iSDAsoil v2 API (satellite, 30 m resolution) |
| Weather | OpenWeather API + NASA POWER API |
| Hosting | Render (free tier) |
| Python | 3.13 |

---

## Project Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app, CORS, lifespan
│   ├── config.py                # Pydantic settings (env vars)
│   ├── api/routes/
│   │   ├── auth.py              # /auth — register, login, JWT, password reset
│   │   ├── crop.py              # /crop — main recommendation endpoint + history
│   │   ├── soil.py              # /soil — iSDAsoil proxy + cache flush
│   │   └── weather.py           # /weather — OpenWeather + NASA POWER
│   ├── services/
│   │   ├── isdasoil.py          # iSDAsoil client + unit calibration layer
│   │   ├── weather.py           # weather aggregation (current + climatology)
│   │   ├── recommendation.py    # planting calendar, agronomic advice enrichment
│   │   └── fertilizer.py        # fertilizer advice per crop
│   ├── ml/
│   │   ├── predictor.py         # load model.pkl, run inference
│   │   ├── train.py             # training script (run locally)
│   │   └── model.pkl            # trained RandomForest (not in git — see below)
│   ├── db/
│   │   ├── database.py          # async engine, session factory
│   │   └── models.py            # User, RecommendationHistory ORM models
│   ├── models/
│   │   ├── request.py           # Pydantic request schemas
│   │   └── response.py          # Pydantic response schemas
│   └── utils/
│       ├── cache.py             # in-memory TTL cache (soil + weather)
│       └── logger.py            # structured logging
├── requirements.txt
├── render.yaml                  # Render deploy blueprint
└── runtime.txt                  # Python 3.13.3
```

---

## Local Setup

### Prerequisites
- Python 3.13
- PostgreSQL running locally (or use a cloud DB)

### 1 — Clone and install

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 2 — Environment variables

Create a `.env` file in `backend/`:

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/cropvana
SECRET_KEY=your-random-secret-key-here
ISDA_USERNAME=your_isdasoil_username
ISDA_PASSWORD=your_isdasoil_password
OPENWEATHER_API_KEY=your_openweather_api_key
ALLOWED_ORIGINS=["http://localhost:8081","exp://localhost:8081"]
DEBUG=true
```

> Get iSDAsoil credentials: https://www.isda-africa.com/isdasoil/
> Get OpenWeather API key: https://openweathermap.org/api

### 3 — Train the model

```bash
python -m app.ml.train
```

This reads `app/ml/Cropvana_Rwanda_Dataset_v2.xlsx`, trains a RandomForestClassifier,
and saves `app/ml/model.pkl`, `app/ml/scaler.pkl`, and `app/ml/label_encoder.pkl`.

### 4 — Run

```bash
uvicorn app.main:app --reload --port 8000
```

API docs at: http://localhost:8000/docs

---

## API Reference

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create a new farmer account |
| `POST` | `/auth/login` | Login, returns JWT token |
| `GET` | `/auth/me` | Current user profile (requires token) |
| `POST` | `/auth/forgot-password` | Generate password reset token |
| `POST` | `/auth/reset-password` | Reset password using token |

### Crop Recommendations

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/crop` | Run ML recommendation for a GPS location |
| `GET` | `/crop/history` | Retrieve past recommendations |

**POST /crop — request body:**
```json
{
  "location": { "latitude": -1.9441, "longitude": 30.0619 },
  "lang": "en",
  "soil_override": {
    "nitrogen": null,
    "phosphorus": null,
    "potassium": null,
    "ph": null
  }
}
```

### Soil & Weather

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/soil?lat=&lon=` | Raw iSDAsoil data for a GPS point |
| `DELETE` | `/soil/cache` | Flush soil cache |
| `GET` | `/weather?lat=&lon=` | Current weather + 10-year rainfall average |

---

## ML Model Details

- **Algorithm**: RandomForestClassifier (100 trees)
- **Features**: N (mg/kg), P (mg/kg), K (mg/kg), Temperature (°C), Humidity (%), pH, Rainfall (mm)
- **Classes**: 21 crops (avocado, banana, blackgram, cassava, coconut, coffee, kidneybeans, lentil, maize, mango, orange, papaya, potato, rice, sorghum, soybean, sweetpotato, tea, tomato, watermelon, wheat)
- **Training accuracy**: 98.1% on held-out test set
- **Training data**: `Cropvana_Rwanda_Dataset_v2.xlsx` — Rwanda-calibrated agronomic dataset

### iSDAsoil Unit Calibration

iSDAsoil returns raw physical measurements that differ in scale from the training data's
nutrient indices. A calibration layer in `services/isdasoil.py` converts them:

| Nutrient | iSDAsoil unit | Scale factor | Training range |
|---|---|---|---|
| N (nitrogen_total) | g/kg total | ×40 | 0–120 |
| P (phosphorous_extractable) | mg/kg Mehlich-3 | ×4.5 | 5–95 |
| K (potassium_extractable) | mg/kg exchangeable | ×0.5 | 5–60 |

Values are clamped to the training range after scaling.

---

## Deployment on Render

The `render.yaml` blueprint configures everything automatically:

1. Push to GitHub
2. In [Render Dashboard](https://dashboard.render.com/) → New → Blueprint
3. Point to your repo — Render reads `render.yaml`
4. Set the three secret env vars manually (ISDA_USERNAME, ISDA_PASSWORD, OPENWEATHER_API_KEY)
5. Upload `model.pkl`, `scaler.pkl`, and `label_encoder.pkl` via Render Shell or include them in the repo

> **Note**: The free tier spins down after 15 min of inactivity. First request after sleep takes ~30–60 s.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | asyncpg PostgreSQL connection string |
| `SECRET_KEY` | Yes | JWT signing secret (min 32 chars) |
| `ISDA_USERNAME` | Yes | iSDAsoil API username |
| `ISDA_PASSWORD` | Yes | iSDAsoil API password |
| `OPENWEATHER_API_KEY` | Yes | OpenWeather API key |
| `ALLOWED_ORIGINS` | Yes | JSON array of allowed CORS origins |
| `DEBUG` | No | Enable debug logging (default: false) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | JWT lifetime (default: 10080 = 7 days) |
