# WindLedger 🌬️ *(Anonymous Submission: `kjhwr`)*

> **Know the wind. Know the error. Trade with institutional confidence.**  
> *UK Day-Ahead Wind Generation Decision & Forecast Accuracy Evaluation Portal*

---

## 🤖 1. AI Tools Disclosure
In full accordance with submission guidelines:
* **AI Tools Utilized:** This project was developed with assistance from **Google Antigravity AI coding assistant**, powered by **Google DeepMind Gemini 3.8 / Claude models**.
* **Scope of AI Assistance:** AI tools were used for domain research on GB BSC settlement rules, codebase architecture and refactoring, vectorization of statistical computations, test suite generation, and technical documentation drafting.
* **Human Verification:** All mathematical formulas (MAE, RMSE, nMAE, P10–P90 quantiles, cashout imbalance equations), data ingestion schemas, and test suites have been verified and validated.

---

## 🔗 2. Live Application & API Links

| Service | Platform | Link | Description |
| :--- | :--- | :--- | :--- |
| **Frontend Portal (UI)** | **Vercel** | [https://windledger.vercel.app](https://windledger.vercel.app) *(or local [http://localhost:5173](http://localhost:5173))* | Full React 19 trading dashboard, trajectory explorer, heatmap & market analytics |
| **Backend API (REST)** | **Render / Heroku** | [https://windledger-api.onrender.com](https://windledger-api.onrender.com) *(or local [http://127.0.0.1:8000](http://127.0.0.1:8000))* | FastAPI Python analytical backend serving 17 high-performance endpoints |
| **Interactive API Docs** | **Custom / Swagger** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) | Modern interactive API documentation portal with live request console |
| **Classic Swagger UI** | **OpenAPI 3.1** | [http://127.0.0.1:8000/swagger](http://127.0.0.1:8000/swagger) | Standard OpenAPI 3.1 Swagger UI specification |

---

## 🛠️ 3. Technology Stack

* **Frontend**: **React 19**, **TypeScript**, **Vite**, **TanStack React Query v5**, **Recharts v3**, **Framer Motion**, Custom Vanilla CSS Design System.
* **Backend**: **Python 3.11+**, **FastAPI**, **Pandas**, **NumPy**, **PyArrow**, **Uvicorn**, **pytest**, **httpx**.
* **Storage Engine**: High-performance columnar **Apache Parquet (Snappy compressed)**.
* **Deployment & DevOps**: **Docker**, **Docker Compose**, **Nginx**, **Vercel** (`vercel.json`), **Render / Heroku** (`render.yaml`, `Procfile`).

---

## 📂 4. Repository Files and Directories

```text
WindLens/ (Repo ID: kjhwr)
├── .gitignore                      # Git exclusion rules (node_modules, pycache, venv)
├── docker-compose.yml              # Multi-container orchestration (backend + frontend)
├── package.json                    # Root workspace package script forwarder
├── Procfile                        # Heroku / Render cloud process deployment entry
├── README.md                       # Comprehensive project documentation
├── render.yaml                     # Render Infrastructure-as-Code deployment blueprint
├── vercel.json                     # Vercel SPA routing and build configuration
│
├── backend/                        # Python FastAPI Backend Service
│   ├── .dockerignore               # Docker build exclusions for backend
│   ├── Dockerfile                  # Production container definition for Python service
│   ├── Procfile                    # Backend-specific process definition
│   ├── requirements.txt            # Python dependencies (FastAPI, Pandas, PyArrow, etc.)
│   ├── runtime.txt                 # Target Python runtime specification (python-3.11.9)
│   │
│   ├── app/                        # Application source code
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI application factory, middleware & lifespan cache warming
│   │   ├── data_store.py           # In-memory Parquet loader and data singleton store
│   │   ├── schemas.py              # Pydantic v2 data models, validation schemas & examples
│   │   │
│   │   ├── ingestion/              # Elexon BMRS ingestion pipelines
│   │   │   ├── __init__.py
│   │   │   └── ingest.py           # Ingestion script for FUELHH and WINDFOR streams
│   │   │
│   │   ├── routers/                # Modular API route controllers
│   │   │   ├── __init__.py         # Package exports
│   │   │   ├── accuracy.py         # Statistical metrics endpoints (MAE, RMSE, heatmap)
│   │   │   ├── data.py             # Parquet dataset summary and CSV streaming export
│   │   │   ├── docs_ui.py          # Custom modern API Reference documentation portal
│   │   │   ├── forecast.py         # Point-in-time decision forecasts & evolution trajectories
│   │   │   ├── meta.py             # Dataset date range and operational metadata
│   │   │   ├── ramps.py            # Wind generation ramp event detection (>800 MW/hr)
│   │   │   ├── system.py           # Health checks, memory RSS tracking & latency benchmarks
│   │   │   └── trading.py          # Financial cashout imbalance risk & optimal bidding
│   │   │
│   │   └── services/               # Core analytical and mathematical engines
│   │       ├── __init__.py
│   │       ├── decision_forecast.py# Cutoff filtering, uncertainty quantiles (P10/P90), caching
│   │       ├── metrics.py          # Vectorized accuracy, horizon decay, and 31x24 heatmap
│   │       ├── ramps.py            # Ramp rate calculation, duration, and forecast tracking
│   │       └── trading.py          # GB BSC cashout pricing model, asymmetric risk & bidding
│   │
│   ├── data/                       # Ingested Elexon BMRS Parquet Datasets
│   │   ├── actuals.parquet         # 1,585 actual half-hourly wind generation records (FUELHH)
│   │   └── forecasts.parquet       # 21,024 multi-vintage wind forecast records (WINDFOR)
│   │
│   └── tests/                      # Pytest Automated Test Suite (34 tests)
│       ├── __init__.py
│       ├── test_api.py             # Core API integration tests
│       ├── test_decision.py        # Point-in-time decision forecast & cutoff adherence tests
│       ├── test_enterprise_api.py # Trading, ramps, data export, and system health tests
│       ├── test_metrics.py         # Vectorized statistical calculations & heatmap tests
│       ├── test_ramps.py           # Ramp event detection logic tests
│       └── test_trading.py         # Cashout pricing, optimal bidding & simulation tests
│
└── frontend/                       # React 19 Single Page Application
    ├── .dockerignore               # Docker build exclusions for frontend
    ├── .gitignore                  # Frontend git exclusion rules
    ├── Dockerfile                  # Multi-stage production container (Node build + Nginx serve)
    ├── index.html                  # HTML5 entry with Google Fonts preconnect
    ├── nginx.conf                  # Production Nginx reverse-proxy configuration
    ├── package.json                # Frontend dependencies and npm scripts
    ├── package-lock.json           # Deterministic dependency lockfile
    ├── tsconfig.json               # TypeScript compiler configuration
    ├── vercel.json                 # Vercel SPA client routing configuration
    ├── vite.config.ts              # Vite bundler configuration & local dev proxy
    │
    ├── public/                     # Static assets and icons
    │   └── favicon.svg             # Wind turbine brand favicon
    │
    └── src/                        # React TypeScript source code
        ├── App.tsx                 # Root application shell, navigation bar & routing
        ├── main.tsx                # React DOM root entry
        ├── index.css               # Vanilla CSS design system, typography & glassmorphism
        │
        ├── pages/                  # Page components
        │   ├── Dashboard.tsx       # Executive macro KPIs, actual vs forecast chart & error hist
        │   ├── ForecastExplorer.tsx# Multi-vintage spaghetti trajectories & audit log
        │   ├── Analytics.tsx       # Horizon decay curves & 31x24 interactive error heatmap
        │   ├── DataExplorer.tsx    # Searchable data grid with CSV export
        │   ├── Settings.tsx        # Cutoff presets, Elexon BMRS documentation & methodology
        │   └── ApiReference.tsx    # Integrated interactive developer API documentation
        │
        └── utils/                  # Shared utility functions
            └── formatDate.ts       # Strict UTC/GMT formatting helpers (prevents timezone rollover)
```

---

## 🚀 5. How to Start the Application

### Option A: Using Docker Compose (Recommended - Single Command)
Runs both the Python FastAPI backend and the React Nginx frontend in isolated containers:

```bash
# 1. Clone or navigate to the repository
cd WindLens

# 2. Build and launch all services
docker compose up --build
```
* **Frontend Web App:** [http://localhost:3000](http://localhost:3000)
* **Backend API & Interactive Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

To stop the containers:
```bash
docker compose down
```

---

### Option B: Local Development Setup (Manual)

#### 1. Start Backend (Python FastAPI)
```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run all 34 automated unit & integration tests
python -m pytest -v

# Start Uvicorn development server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
* FastAPI is now running at: `http://127.0.0.1:8000`
* Interactive API Documentation: `http://127.0.0.1:8000/docs`

#### 2. Start Frontend (React 19 + Vite)
In a separate terminal:
```bash
cd frontend

# Install dependencies
npm install

# Verify production build
npm run build

# Start Vite dev server
npm run dev
```
* React Web Application is now running at: `http://localhost:5173`

---

## 🧪 6. Testing & Quality Assurance

The application includes an automated test suite verifying data integrity, cutoff adherence, mathematical formulas, and endpoint responses:

```bash
cd backend
python -m pytest -v
```

**Test Suite Coverage (34/34 Passing in ~1.6s):**
* `test_api.py`: Root, metadata, decision forecast, and custom documentation routes.
* `test_decision.py`: Strict adherence to D-1 cutoff times (no lookahead bias), horizon positivity, and 24h delivery completeness.
* `test_metrics.py`: MAE, RMSE, bias, normalized error percentage, horizon decay, and 31×24 heatmap calculation.
* `test_trading.py`: Financial balancing cashout modeling, System Buy/Sell spreads, and optimal bidding schedule generation.
* `test_ramps.py`: Ramp event identification (>800 MW/hr) and forecast tracking accuracy.
* `test_enterprise_api.py`: Integration tests for all enterprise routes, CSV data export streaming, and latency benchmarks.

---

## 📊 7. Official Elexon BMRS Datasets Implemented

The platform directly ingests and evaluates the two official Elexon BMRS streams:

| Dataset | Elexon API Endpoint | Local Parquet Path | Rows Ingested | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Actuals (Outturn)** | [`FUELHH/stream`](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream) | `backend/data/actuals.parquet` | **1,585 rows** | Half-hourly national metered wind generation (`fuelType=WIND`) |
| **Forecasts (Multi-Vintage)** | [`WINDFOR/stream`](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream) | `backend/data/forecasts.parquet` | **21,024 rows** | Rolling national wind generation forecasts published at frequent intervals |

### Day-Ahead Market Decision Mechanics:
* **Scope:** Purchase decisions executed throughout **January 2026** (Jan 1 – Jan 31).
* **Delivery Window:** Power delivered on Day D (Jan 1, 2026 00:00 UTC through Feb 1, 2026 00:00 UTC).
* **Auction Gate Closures:** EPEX SPOT (09:20 UTC) and Nord Pool (10:00 UTC) on Day D-1.

---

## ☁️ 8. Cloud Deployment Guide

### Deploy Frontend to Vercel
1. Import the repository into [Vercel](https://vercel.com).
2. Set Root Directory to `frontend` (or use the root `vercel.json`).
3. Framework Preset: **Vite**.
4. Build Command: `npm run build`. Output Directory: `dist`.
5. Environment Variable: `VITE_API_URL=https://your-backend-app.onrender.com`.

### Deploy Backend to Render / Heroku
1. Create a new Web Service on [Render](https://render.com) or [Heroku](https://heroku.com).
2. Select Python 3.11 environment.
3. Build Command: `pip install -r backend/requirements.txt`.
4. Start Command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. The repository includes pre-configured `render.yaml` and `Procfile` for zero-configuration deployments.

---

## 📄 9. License
MIT License. Built for UK power utility day-ahead trading and quantitative risk teams.
