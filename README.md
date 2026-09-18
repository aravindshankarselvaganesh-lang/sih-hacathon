# SULFSCAN: Intelligent Colorimetric H₂S Dosimeter & Refinery Worker Safety Platform

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![Flutter](https://img.shields.io/badge/Flutter-3.0%2B-02569B.svg)](https://flutter.dev/)
[![OpenCV](https://img.shields.io/badge/OpenCV-4.9%2B-5C3EE8.svg)](https://opencv.org/)
[![DGMS](https://img.shields.io/badge/Standards-DGMS%20%7C%20OISD--STD--105-success.svg)]()

SULFSCAN is an industrial-grade occupational health and hazardous gas monitoring platform designed for **Smart India Hackathon (SIH)**. It monitors worker exposure to toxic Hydrogen Sulfide ($H_2S$) in oil refineries, petrochemical complexes, and underground mines using wearable passive colorimetric dosimeters, mobile computer vision, environmental data fusion, and offline-first edge computing.

---

## 1. Full Architectural Specification (Tech Stack Mapping)

| Layer / Domain | Technology Used | Role / Purpose |
| :--- | :--- | :--- |
| **1. Mobile App (Frontend)** | **Flutter (Dart)** | Cross-platform UI for "one-shot" badge capture, viewfinder reticles, macro camera control, and worker shift dashboards. |
| **2. Computer Vision Engine** | **OpenCV (Mobile SDK / C++ / Python)** | Quadrilateral badge segmentation, 4-point perspective warping, illumination normalization via reference patches, and CIE L\*a\*b\* chemical strip $\Delta E$ extraction. |
| **3. Barcode Identification** | **ZBar / ZXing** | Decodes 2D DataMatrix printed on dosimeter badges to bind physical badges to worker IDs and batch calibration profiles. |
| **4. AI / Calibration Model** | **ONNX Runtime Mobile / TensorFlow Lite** | Offline multivariate regression model calculating cumulative $H_2S$ exposure ($\text{ppm}\cdot\text{hr}$) and shift TWA from color deltas and ambient telemetry. |
| **5. Environmental Data Fusion** | **Local SCADA Database / Weather API** | Fuses ambient temperature (°C) and relative humidity (%) into Arrhenius reaction kinetics without requiring bulky wearable sensors. |
| **6. Local Storage (Offline-First)** | **SQLite (or Hive)** | Securely logs shift records and exposure calculations locally on device when workers operate in shielded or explosion-proof plant zones. |
| **7. Central Backend & Sync** | **Python (FastAPI) & PostgreSQL** | High-performance asynchronous REST API (`/api/v1/sync/batch`) to sync offline mobile records up to the central refinery safety database. |
| **8. Compliance & Reporting** | **ReportLab / PDFKit** | Auto-generates statutory audit-ready PDF compliance certificates conforming to **DGMS Regulation 124** and **OISD-STD-105/112** standards. |

---

## 2. Directory Structure

```
sih-hacathon-main/
├── backend/                                   # Central Backend, CV Engine, AI, Reports
│   ├── app/
│   │   ├── main.py                            # FastAPI entry point & CORS
│   │   ├── core/                              # Config & Async Database (PostgreSQL/SQLite)
│   │   ├── models/                            # SQLAlchemy models (Worker, Badge, ScanRecord)
│   │   ├── schemas/                           # Pydantic validation schemas
│   │   ├── api/v1/                            # REST API endpoints (dosimeter, sync, workers, reports)
│   │   └── services/
│   │       ├── cv_engine.py                   # OpenCV segmentation, warp & LAB colorimetry
│   │       ├── barcode_engine.py              # ZXing/ZBar 2D DataMatrix decoder
│   │       ├── calibration_ai.py              # AI regression model for H2S exposure
│   │       ├── environmental_fusion.py        # Weather API & SCADA telemetry integration
│   │       └── compliance_reportlab.py        # ReportLab DGMS & OISD PDF audit generator
│   ├── tests/                                 # Pytest test suite
│   ├── requirements.txt
│   ├── Dockerfile                             # Backend container (python:3.11-slim, uvicorn app.main:app)
│   ├── .dockerignore
│   ├── .env.example                           # DATABASE_URL, OPENWEATHER_API_KEY, ENV, CORS_ORIGINS
│   └── run_server.py                          # Server launcher script
│
├── sulfisafe/                                 # Web Dashboard (Vite + React + Supabase)
│   ├── src/                                   # React source, supabaseClient.js
│   ├── package.json                           # npm run build entry for CI
│   ├── vercel.json
│   └── dist/                                  # Production build output (ignored)
│
├── h2s-safety-monitor/                        # Web Monitor (Vite + React)
│   ├── src/
│   ├── package.json
│   ├── vercel.json
│   └── dist/                                  # Production build output (ignored)
│
├── mobile_app/                                # Mobile App (Frontend) - Flutter (Dart)
│   ├── pubspec.yaml                           # Flutter dependencies: camera, sqflite, http, etc.
│   └── lib/
│       ├── main.dart                          # App entry point & theme
│       ├── models/                            # WorkerBadge, ScanRecord, EnvironmentalData
│       ├── database/                          # SQLite offline-first database
│       ├── services/                          # Camera, Barcode, Weather, ONNX, and Sync services
│       └── screens/                           # Dashboard, ScanDosimeter, Result, History, Audit
│
├── ml_calibration/                            # AI / Calibration Model Tools
│   ├── export_onnx.py                         # Arrhenius chemical kinetics regression model
│   └── badge_color_chart.py                   # Standard colorimetry references & DGMS limits
│
├── .vercel/                                   # Vercel deployment metadata (ignored)
├── .github/workflows/ci.yml                   # CI: pytest backend + npm run build (sulfisafe)
└── .gitignore                                 # Ignores dist/, .vercel/, *.db, __pycache__, .env, etc.
```

> **Note — double-nested extraction:** this repo is distributed as a zip that
> extracts to `sih-hacathon-main/sih-hacathon-main/` (double-nested folder).
> If your path shows `.../sih-hacathon-main/sih-hacathon-main`, the inner
> folder is the actual project root (contains `backend/`, `sulfisafe/`, `README.md`).

### Environment Setup (Supabase / Vercel)

Backend (`backend/.env`, see `backend/.env.example`):
```bash
DATABASE_URL=sqlite+aiosqlite:///./refinery_safety.db
OPENWEATHER_API_KEY=
ENV=dev
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

Frontend (`sulfisafe/` / `h2s-safety-monitor/` on Vercel):
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` (a.k.a. `VITE_SUPABASE_KEY`) — Supabase publishable/anon key

Set these in the Vercel dashboard (Project → Settings → Environment Variables)
as well as in a local `.env` file for `vite dev`. `.vercel/` holds local
Vercel CLI metadata and is intentionally git-ignored.

---

## 3. Chemical Dosimetry & Mathematical Kinetics

When passive chemical dosimeters (Lead Acetate / Metal Salt matrices) are exposed to Hydrogen Sulfide ($H_2S$), a brown/black Lead(II) Sulfide precipitate forms:
$$\text{Pb(C}_2\text{H}_3\text{O}_2)_2 + \text{H}_2\text{S} \longrightarrow \text{PbS} \downarrow + 2\,\text{CH}_3\text{COOH}$$

### Kinetic Compensation Formula
Color change $\Delta E$ in CIE 1976 $L^*a^*b^*$ color space is governed by cumulative dosage ($\text{ppm}\cdot\text{hr}$), modified by ambient temperature ($T$) and relative humidity ($RH$):
$$\Delta E = k \cdot \sqrt{\text{Dosage}} \cdot \left[1 + 0.012\,(T - 25^\circ\text{C})\right] \cdot \left[1 + 0.008\,(RH - 50\%)\right]$$

Inverted regression solved by the ONNX / Analytical AI Model:
$$\text{Cumulative Dosage (ppm}\cdot\text{hr)} = \left(\frac{\Delta E}{k \cdot f(T) \cdot f(RH)}\right)^2$$
$$\text{Shift TWA (ppm)} = \frac{\text{Cumulative Dosage}}{\text{Shift Duration (hours)}}$$

---

## 4. Statutory Compliance Standards

* **DGMS Regulation 124 (Directorate General of Mines Safety)**:
  * **Safe Action Level**: $< 5.0\text{ ppm}$
  * **8-Hour Shift TWA Limit**: $10.0\text{ ppm}$
  * **Short-Term Exposure Limit (STEL)**: $15.0\text{ ppm}$
* **OISD-STD-105 & OISD-STD-112 (Oil Industry Safety Directorate)**:
  * Mandatory work permit sign-off and computerized dosimetry archiving for all personnel in Zone-0/1 refinery units.

---

## 5. Quickstart Guide

### Running the Python Backend
```bash
cd backend
python -m pip install -r requirements.txt
python run_server.py
```
* Interactive API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
* DGMS / OISD PDF Audit Endpoint: [http://localhost:8000/api/v1/reports/dgms-oisd/pdf](http://localhost:8000/api/v1/reports/dgms-oisd/pdf)

### Running the Flutter Mobile App
```bash
cd mobile_app
flutter pub get
flutter run
```

---

## 6. Production Deploy

### Backend (uvicorn / Docker)

```bash
# 1. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env: DATABASE_URL, API_KEY, ENV=prod,
# CORS_ORIGINS, OPENWEATHER_API_KEY

# 2a. Run directly with uvicorn
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 2b. Or run with Docker (includes HEALTHCHECK on /healthz)
cd backend
docker build -t sulfscan-backend .
docker run --rm -p 8000:8000 --env-file .env sulfscan-backend
curl -f http://localhost:8000/healthz
```

> In `ENV=prod` the interactive docs (`/docs`, `/redoc`, `/openapi.json`)
> are disabled automatically. Health probes: `GET /` and `GET /healthz`.

### Frontend (Vercel)

Deploy `sulfisafe/` (and/or `h2s-safety-monitor/`) to Vercel and set these
environment variables in **Project → Settings → Environment Variables**:

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` (a.k.a. `VITE_SUPABASE_KEY`) — Supabase anon key

```bash
cd sulfisafe
npm ci
npm run build   # output: dist/
```

### Mobile (Flutter)

Point the app at the deployed backend via `--dart-define`:

```bash
cd mobile_app
flutter pub get
flutter run --dart-define API_BASE_URL=https://<backend-host>/api/v1
# Release build example:
flutter build apk --release --dart-define API_BASE_URL=https://<backend-host>/api/v1
```

## 7. Security Note

- **Rotate keys regularly:** `API_KEY`, `OPENWEATHER_API_KEY`, and the
  Supabase anon/service keys. Never commit real values — only placeholders
  in `backend/.env.example`. Production secrets live in the host env / Docker
  `--env-file` / Vercel dashboard, never in git.
- **Supabase RLS:** keep Row Level Security **enabled** on all tables holding
  worker/scan data; grant least-privilege roles to anon/authenticated keys and
  restrict service-role usage to server-side jobs only.
- **CORS:** `CORS_ORIGINS` is explicit (no wildcard-with-credentials); set it
  to the exact production frontend origin(s).
- **Docs lockdown:** `ENV=prod` disables `/docs` and `/openapi.json`.
