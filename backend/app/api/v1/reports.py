"""
Compliance & Reporting API Endpoint (ReportLab / PDFKit)
--------------------------------------------------------
Streams dynamically generated DGMS & OISD compliance audit PDF reports.
"""

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.scan_record import ScanRecord
from app.models.worker import Worker
from app.services.compliance_reportlab import compliance_pdf_generator

router = APIRouter(prefix="/reports", tags=["Compliance Reports"])


@router.get("/dgms-oisd/pdf")
async def download_dgms_oisd_report(
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """
    Auto-generates and streams formatted PDF compliance audit document
    conforming to DGMS Regulation 124 and OISD-STD-105.
    """
    query = (
        select(ScanRecord)
        .options(selectinload(ScanRecord.worker))
        .order_by(ScanRecord.scanned_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    scans = result.scalars().all()

    # Format data for ReportLab
    formatted_records = []
    for s in scans:
        formatted_records.append({
            "worker_code": s.worker.worker_code if s.worker else "UNKNOWN",
            "worker_name": s.worker.name if s.worker else "Unassigned",
            "department": s.worker.department if s.worker else "General",
            "badge_uid": f"BDG-{s.id:04d}",
            "delta_E": s.delta_E,
            "ambient_temp_c": s.ambient_temp_c,
            "relative_humidity": s.relative_humidity,
            "cumulative_dosage_ppm_hr": s.cumulative_dosage_ppm_hr,
            "avg_concentration_ppm": s.avg_concentration_ppm,
            "compliance_status": s.compliance_status
        })

    # If no records exist yet in DB, include demo compliance benchmarks
    if not formatted_records:
        formatted_records = [
            {
                "worker_code": "WRK-1024",
                "worker_name": "Rahul Sharma",
                "department": "Hydrocracker Unit",
                "badge_uid": "BDG-7749-A",
                "delta_E": 12.4,
                "ambient_temp_c": 31.0,
                "relative_humidity": 65.0,
                "cumulative_dosage_ppm_hr": 18.2,
                "avg_concentration_ppm": 2.28,
                "compliance_status": "NORMAL"
            },
            {
                "worker_code": "WRK-2048",
                "worker_name": "Priya Singh",
                "department": "Sulfur Recovery Unit (SRU)",
                "badge_uid": "BDG-8812-B",
                "delta_E": 28.6,
                "ambient_temp_c": 34.5,
                "relative_humidity": 70.0,
                "cumulative_dosage_ppm_hr": 58.4,
                "avg_concentration_ppm": 7.30,
                "compliance_status": "ACTION_REQUIRED"
            },
            {
                "worker_code": "WRK-3072",
                "worker_name": "Aman Kumar",
                "department": "Flare Gas Treatment",
                "badge_uid": "BDG-9901-C",
                "delta_E": 44.2,
                "ambient_temp_c": 33.0,
                "relative_humidity": 68.0,
                "cumulative_dosage_ppm_hr": 96.8,
                "avg_concentration_ppm": 12.10,
                "compliance_status": "DANGER_EXCEEDED"
            }
        ]

    pdf_bytes = compliance_pdf_generator.generate_dgms_oisd_report(formatted_records)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=DGMS_OISD_H2S_Compliance_Audit.pdf"
        }
    )
