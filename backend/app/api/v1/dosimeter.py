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
from typing import Optional
import uuid

from app.core.database import get_db
from app.models.worker import Worker
from app.models.badge import Badge
from app.models.scan_record import ScanRecord
from app.schemas.scan import DosimeterAnalysisResponse
from app.services.cv_engine import cv_engine
from app.services.environmental_fusion import environmental_fusion
from app.services.calibration_ai import calibration_ai

router = APIRouter(prefix="/dosimeter", tags=["Dosimeter Analysis"])


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
    db: AsyncSession = Depends(get_db)
):
    """
    Complete end-to-end one-shot badge analysis:
    1. Reads image bytes through OpenCV (perspective warp, white balance, CIE LAB extraction).
    2. Fuses ambient Temperature & Relative Humidity from plant SCADA / Weather API.
    3. Executes AI regression model to compute cumulative H2S dosage (ppm*hr) and shift TWA (ppm).
    4. Audits against DGMS / OISD standards and stores record in the central database.
    """
    image_bytes = await file.read()
    try:
        cv_result = cv_engine.process_image_bytes(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Computer Vision processing failed: {str(e)}")

    # 2. Environmental Telemetry Fusion
    env_data = await environmental_fusion.get_ambient_conditions(latitude, longitude)

    # 3. AI Calibration Regression
    calib = calibration_ai.calculate_exposure(
        extracted_L=cv_result["extracted_L"],
        extracted_a=cv_result["extracted_a"],
        extracted_b=cv_result["extracted_b"],
        delta_E=cv_result["delta_E"],
        ambient_temp_c=env_data["ambient_temp_c"],
        relative_humidity=env_data["relative_humidity"],
        exposure_hours=exposure_hours
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
    await db.commit()

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
