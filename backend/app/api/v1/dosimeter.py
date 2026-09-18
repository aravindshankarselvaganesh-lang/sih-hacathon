"""
Dosimeter Analysis Endpoint (OpenCV + AI Calibration Fusion)
------------------------------------------------------------
Processes one-shot camera image or pre-computed colorimetry,
retrieves ambient telemetry via Environmental Fusion,
runs the AI calibration regression model,
and saves the audit record to the central database.
"""

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from typing import Optional
import logging
import uuid

from app.core.database import get_db
from app.core.security import require_api_key
from app.models.worker import Worker
from app.models.badge import Badge
from app.models.scan_record import ScanRecord
from app.schemas.scan import DosimeterAnalysisResponse
from app.services.cv_engine import cv_engine
from app.services.environmental_fusion import environmental_fusion
from app.services.calibration_ai import calibration_ai
from app.services.barcode_engine import barcode_engine

router = APIRouter(prefix="/dosimeter", tags=["Dosimeter Analysis"])

logger = logging.getLogger(__name__)

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}


@router.post("/analyze-image", response_model=DosimeterAnalysisResponse)
async def analyze_badge_image(
    file: UploadFile = File(...),
    worker_code: str = Form(...),
    badge_uid: str = Form(...),
    exposure_hours: float = Form(8.0),
    shift_type: str = Form("SHIFT_A"),
    scan_event: str = Form("EXIT"),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_api_key),
):
    """
    Complete end-to-end one-shot badge analysis:
    1. Reads image bytes through OpenCV (perspective warp, white balance, CIE LAB extraction).
    2. Fuses ambient Temperature & Relative Humidity from plant SCADA / Weather API.
    3. Executes AI regression model to compute cumulative H2S dosage (ppm*hr) and shift TWA (ppm).
    4. Audits against DGMS / OISD standards and stores record in the central database.
    """
    image_bytes = await file.read()
    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image content_type '{file.content_type}'. Allowed: {sorted(ALLOWED_CONTENT_TYPES)}",
        )
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image upload.")
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Image too large ({len(image_bytes)} bytes). Max allowed is {MAX_IMAGE_BYTES} bytes (10MB).",
        )
    try:
        cv_result = cv_engine.process_image_bytes(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Computer Vision processing failed: {str(e)}")

    # 1b. Barcode decode attempt on the same image (best-effort, fail-open on
    # no-code; fail-closed 400 on badge_uid mismatch when both present).
    # Cross-checks the printed DataMatrix badge_uid against the Form badge_uid.
    try:
        import cv2 as _cv2
        import numpy as _np
        _np_arr = _np.frombuffer(image_bytes, _np.uint8)
        _img_np = _cv2.imdecode(_np_arr, _cv2.IMREAD_COLOR)
        _decoded = barcode_engine.decode_badge_matrix(_img_np) if _img_np is not None else None
        logger.info("Barcode decode attempt result: %s", _decoded)
        if _decoded:
            _decoded_uid = _decoded.get("badge_uid")
            if _decoded_uid and badge_uid and _decoded_uid != badge_uid:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Badge UID mismatch: form badge_uid '{badge_uid}' != "
                        f"barcode badge_uid '{_decoded_uid}'. Rescan correct badge."
                    ),
                )
            if _decoded.get("expired"):
                logger.warning(
                    "Expired badge LOT scanned: %s (%s)",
                    _decoded.get("batch_lot"), _decoded.get("expiry_warning"),
                )
    except HTTPException:
        raise
    except Exception as exc:
        # Best-effort only: decode failures must not block colorimetry.
        logger.warning("Barcode decode attempt failed: %s", exc)

    # 2. Environmental Telemetry Fusion
    env_data = await environmental_fusion.get_ambient_conditions(latitude, longitude)

    # 3b. Badge lookup (404 if unknown) — do before AI so k_calibration can be used
    badge_query = await db.execute(select(Badge).where(Badge.badge_uid == badge_uid))
    badge = badge_query.scalars().first()
    if not badge:
        raise HTTPException(status_code=404, detail=f"Unknown badge_uid '{badge_uid}'. Badge must be registered.")
    k_factor = badge.k_calibration if getattr(badge, "k_calibration", None) else 3.8

    # 3. AI Calibration Regression
    calib = calibration_ai.calculate_exposure(
        extracted_L=cv_result["extracted_L"],
        extracted_a=cv_result["extracted_a"],
        extracted_b=cv_result["extracted_b"],
        delta_E=cv_result["delta_E"],
        ambient_temp_c=env_data["ambient_temp_c"],
        relative_humidity=env_data["relative_humidity"],
        exposure_hours=exposure_hours,
        k_factor=k_factor,
    )

    # 4. Worker & Badge Lookup/Creation
    worker_query = await db.execute(select(Worker).where(Worker.worker_code == worker_code))
    worker = worker_query.scalars().first()
    if not worker:
        # Create standard worker profile if not already registered
        worker = Worker(
            worker_code=worker_code,
            name=f"Worker {worker_code}",
            department="Refinery Operations"
        )
        db.add(worker)
        await db.flush()

    # 5. Save Scan Record
    scan_rec = ScanRecord(
        client_uuid=str(uuid.uuid4()),
        worker_id=worker.id,
        badge_id=badge.id,
        shift_type=shift_type,
        scan_event=scan_event,
        location_name="Crude Distillation Zone-01",
        latitude=env_data.get("latitude"),
        longitude=env_data.get("longitude"),
        ambient_temp_c=env_data["ambient_temp_c"],
        relative_humidity=env_data["relative_humidity"],
        weather_source=env_data["weather_source"],
        extracted_L=cv_result["extracted_L"],
        extracted_a=cv_result["extracted_a"],
        extracted_b=cv_result["extracted_b"],
        delta_E=cv_result["delta_E"],
        exposure_hours=exposure_hours,
        cumulative_dosage_ppm_hr=calib["cumulative_dosage_ppm_hr"],
        avg_concentration_ppm=calib["avg_concentration_ppm"],
        compliance_status=calib["compliance_status"],
        dgms_compliant=calib["dgms_compliant"],
        oisd_compliant=calib["oisd_compliant"]
    )
    db.add(scan_rec)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        logger.warning("Dosimeter scan commit IntegrityError: %s", exc)
        raise HTTPException(status_code=409, detail="Scan record conflicts with existing data.")
    except Exception as exc:
        await db.rollback()
        logger.exception("Dosimeter scan commit failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to persist scan record.")

    return DosimeterAnalysisResponse(
        success=True,
        worker_code=worker.worker_code,
        worker_name=worker.name,
        department=worker.department,
        badge_uid=badge_uid,
        delta_E=cv_result["delta_E"],
        cumulative_dosage_ppm_hr=calib["cumulative_dosage_ppm_hr"],
        avg_concentration_ppm=calib["avg_concentration_ppm"],
        ambient_temp_c=env_data["ambient_temp_c"],
        relative_humidity=env_data["relative_humidity"],
        weather_source=env_data["weather_source"],
        compliance_status=calib["compliance_status"],
        dgms_compliant=calib["dgms_compliant"],
        oisd_compliant=calib["oisd_compliant"],
        message=calib["message"]
    )
