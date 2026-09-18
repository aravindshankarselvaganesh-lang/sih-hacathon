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
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine, init_db
import app.models  # noqa: F401 - ensure SQLAlchemy models are registered
from app.api.v1 import dosimeter, sync, workers, reports


logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    try:
        await init_db()
        logger.info("Startup: database initialized.")
    except Exception as exc:
        logger.exception("Startup: init_db failed: %s", exc)
        raise
    yield
    logger.info("Shutdown: application lifespan ended.")


_is_prod = settings.ENV.lower() in ("prod", "production")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent Colorimetric H2S Dosimeter Badge & Refinery Occupational Safety Platform",
    lifespan=lifespan,
    docs_url=None if _is_prod else "/docs",
    redoc_url=None if _is_prod else "/redoc",
    openapi_url=None if _is_prod else "/openapi.json",
)

# CORS Middleware (permitting Flutter Mobile, Web Dashboards, and Field Terminals)
# Never use wildcard with credentials: derive origins from env.
_cors_origins = settings.CORS_ORIGINS or []
if not _cors_origins:
    logger.warning("CORS_ORIGINS is empty; defaulting to no external origins.")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True if _cors_origins else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 Routers
app.include_router(dosimeter.router, prefix=settings.API_V1_STR)
app.include_router(sync.router, prefix=settings.API_V1_STR)
app.include_router(workers.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)


@app.get("/healthz")
async def healthz():
    """Liveness probe (no DB dependency)."""
    return {"status": "ok", "version": settings.VERSION}


@app.get("/readyz")
async def readyz():
    """Readiness probe (verifies DB connectivity)."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"ready": True, "database": "up", "version": settings.VERSION}
    except Exception as exc:
        logger.exception("Readiness check failed (DB unreachable): %s", exc)
        raise HTTPException(status_code=503, detail="Database not ready.")


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
