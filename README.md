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
sih/
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
│   └── run_server.py                          # Server launcher script
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
└── ml_calibration/                            # AI / Calibration Model Tools
    ├── export_onnx.py                         # Arrhenius chemical kinetics regression model
    └── badge_color_chart.py                   # Standard colorimetry references & DGMS limits
```

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
