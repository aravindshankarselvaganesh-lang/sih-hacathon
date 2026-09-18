"""
Compliance & Reporting API Endpoint (ReportLab / PDFKit)
--------------------------------------------------------
Streams dynamically generated DGMS & OISD compliance audit PDF reports.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import logging

from app.core.database import get_db
from app.core.security import require_api_key
from app.models.scan_record import ScanRecord
from app.models.worker import Worker
from app.services.compliance_reportlab import compliance_pdf_generator

router = APIRouter(prefix="/reports", tags=["Compliance Reports"])

logger = logging.getLogger(__name__)


@router.get("/dgms-oisd/pdf")
async def download_dgms_oisd_report(
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_api_key),
):
    """
    Auto-generates and streams formatted PDF compliance audit document
    conforming to DGMS Regulation 124 and OISD-STD-105.
    """
    query = (
        select(ScanRecord)
        .options(selectinload(ScanRecord.worker), selectinload(ScanRecord.badge))
        .order_by(ScanRecord.scanned_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    scans = result.scalars().all()

    # Format data for ReportLab — use real badge_uid via join, no demo data
    formatted_records = []
    for s in scans:
        real_badge_uid = None
        try:
            if getattr(s, "badge", None) and getattr(s.badge, "badge_uid", None):
                real_badge_uid = s.badge.badge_uid
        except Exception:
            real_badge_uid = None
        formatted_records.append({
            "worker_code": s.worker.worker_code if s.worker else "UNKNOWN",
            "worker_name": s.worker.name if s.worker else "Unassigned",
            "department": s.worker.department if s.worker else "General",
            "badge_uid": real_badge_uid or "UNKNOWN",
            "delta_E": s.delta_E,
            "ambient_temp_c": s.ambient_temp_c,
            "relative_humidity": s.relative_humidity,
            "cumulative_dosage_ppm_hr": s.cumulative_dosage_ppm_hr,
            "avg_concentration_ppm": s.avg_concentration_ppm,
            "compliance_status": s.compliance_status
        })

    # No demo fallback: return empty roster with notice (PDF generator handles empty list)
    empty_notice = len(formatted_records) == 0

    try:
        pdf_bytes = compliance_pdf_generator.generate_dgms_oisd_report(
            formatted_records, empty_notice=empty_notice
        )
    except TypeError:
        # Backwards compat if generator lacks empty_notice kwarg
        try:
            pdf_bytes = compliance_pdf_generator.generate_dgms_oisd_report(formatted_records)
        except Exception as exc:
            logger.exception("PDF generation failed: %s", exc)
            raise HTTPException(status_code=500, detail="Failed to generate compliance PDF.")
    except Exception as exc:
        logger.exception("PDF generation failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to generate compliance PDF.")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=DGMS_OISD_H2S_Compliance_Audit.pdf"
        }
    )
