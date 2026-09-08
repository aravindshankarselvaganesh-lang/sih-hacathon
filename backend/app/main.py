"""
SULFSCAN Central Refinery Backend & Sync API (FastAPI)
------------------------------------------------------
Complies with the full SIH Tech Stack specification:
- Computer Vision Engine: OpenCV (Perspective warp, white balance, LAB colorimetry)
- Barcode Identification: ZBar / ZXing (2D DataMatrix)
- AI / Calibration: Arrhenius chemical kinetics regression model (ONNX Runtime)
- Environmental Fusion: Plant SCADA telemetry / Weather API
- Offline Sync: SQLite to PostgreSQL bulk sync
- Compliance: ReportLab DGMS / OISD-STD-105 PDF audit reporting
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.api.v1 import dosimeter, sync, workers, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    await init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent Colorimetric H2S Dosimeter Badge & Refinery Occupational Safety Platform",
    lifespan=lifespan
)

# CORS Middleware (permitting Flutter Mobile, Web Dashboards, and Field Terminals)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 Routers
app.include_router(dosimeter.router, prefix=settings.API_V1_STR)
app.include_router(sync.router, prefix=settings.API_V1_STR)
app.include_router(workers.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)


@app.get("/")
async def root_health_check():
    return {
        "status": "ONLINE",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "standards": [
            "DGMS Regulation 124 (TWA limit: 10 ppm)",
            "OISD-STD-105 (Work Permit System & Gas Monitoring)",
            "OISD-STD-112 (Safe Handling of Hydrogen Sulfide)"
        ],
        "endpoints": {
            "swagger_docs": "/docs",
            "dosimeter_analysis": f"{settings.API_V1_STR}/dosimeter/analyze-image",
            "offline_sync": f"{settings.API_V1_STR}/sync/batch",
            "workers": f"{settings.API_V1_STR}/workers",
            "compliance_pdf": f"{settings.API_V1_STR}/reports/dgms-oisd/pdf"
        }
    }
