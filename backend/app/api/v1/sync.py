"""
Offline-First Mobile Sync Endpoint (SQLite -> Central PostgreSQL)
-----------------------------------------------------------------
Accepts batches of scan records accumulated locally on mobile devices
during plant operations in zero-connectivity or intrinsically safe shielded zones.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.core.database import get_db
from app.models.worker import Worker
from app.models.scan_record import ScanRecord
from app.schemas.scan import BatchSyncRequest, BatchSyncResponse

router = APIRouter(prefix="/sync", tags=["Mobile Offline Sync"])


@router.post("/batch", response_model=BatchSyncResponse)
async def sync_offline_records(
    payload: BatchSyncRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Idempotent batch sync endpoint:
    Inserts incoming records using client_uuid to prevent duplicate logging.
    """
    synced = 0
    rejected = 0

    for rec in payload.records:
        # Check if client_uuid already exists (idempotency guard)
        existing = await db.execute(
            select(ScanRecord).where(ScanRecord.client_uuid == rec.client_uuid)
        )
        if existing.scalars().first():
            rejected += 1
            continue

        # Check or create worker
        worker_res = await db.execute(
            select(Worker).where(Worker.worker_code == rec.worker_code)
        )
        worker = worker_res.scalars().first()
        if not worker:
            worker = Worker(
                worker_code=rec.worker_code,
                name=f"Worker {rec.worker_code}",
                department="Plant Field Unit"
            )
            db.add(worker)
            await db.flush()

        scan_item = ScanRecord(
            client_uuid=rec.client_uuid,
            worker_id=worker.id,
            shift_type=rec.shift_type,
            scan_event=rec.scan_event,
            location_name=rec.location_name,
            latitude=rec.latitude,
            longitude=rec.longitude,
            ambient_temp_c=rec.ambient_temp_c,
            relative_humidity=rec.relative_humidity,
            weather_source=rec.weather_source,
            extracted_L=rec.extracted_L,
            extracted_a=rec.extracted_a,
            extracted_b=rec.extracted_b,
            delta_E=rec.delta_E,
            exposure_hours=rec.exposure_hours,
            cumulative_dosage_ppm_hr=rec.cumulative_dosage_ppm_hr,
            avg_concentration_ppm=rec.avg_concentration_ppm,
            compliance_status=rec.compliance_status,
            dgms_compliant=rec.dgms_compliant,
            oisd_compliant=rec.oisd_compliant,
            scanned_at=rec.scanned_at,
            synced_at=datetime.utcnow()
        )
        db.add(scan_item)
        synced += 1

    await db.commit()

    return BatchSyncResponse(
        synced_count=synced,
        rejected_count=rejected,
        message=f"Sync successful: {synced} records committed to central database, {rejected} duplicate records ignored."
    )
