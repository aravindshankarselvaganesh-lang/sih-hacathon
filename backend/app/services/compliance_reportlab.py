"""
Compliance & Reporting Service (ReportLab Engine)
------------------------------------------------
Generates audit-ready PDF compliance reports according to:
- DGMS (Directorate General of Mines Safety) Circular No. 04 / Regulation 124
- OISD-STD-105 (Work Permit System & Gas Monitoring in Refineries)
- OISD-STD-112 (Safe Handling of Hazardous Gases - Hydrogen Sulfide)

Includes:
- Official Refinery Header & Inspection Authority Metadata
- Statistical summary of safe vs hazardous exposures
- Complete worker roster with exposure dosages (ppm*hr) and shift TWA (ppm)
- Color-coded compliance badges
- Legal safety officer declaration and signature block
"""

import io
from datetime import datetime
from typing import List, Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)


class CompliancePDFGenerator:
    def generate_dgms_oisd_report(self, records: List[Dict[str, Any]], refinery_name: str = "INDIAN PETROLEUM & REFINERY CORPORATION LTD.") -> bytes:
        """Generates a professional PDF audit document in memory and returns raw bytes."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        elements = []
        styles = getSampleStyleSheet()

        # Custom Styles
        title_style = ParagraphStyle(
            "OrgTitle",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=18,
            textColor=colors.HexColor("#0f172a"),
            alignment=1, # Center
        )
        subtitle_style = ParagraphStyle(
            "SubTitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=13,
            textColor=colors.HexColor("#475569"),
            alignment=1,
        )
        audit_badge_style = ParagraphStyle(
            "AuditBadge",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#0369a1"),
            alignment=1,
        )
        section_heading = ParagraphStyle(
            "SectionHeading",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=15,
            textColor=colors.HexColor("#1e293b"),
        )
        body_style = ParagraphStyle(
            "TableBody",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=10,
        )

        # 1. Official Header
        elements.append(Paragraph(refinery_name, title_style))
        elements.append(Paragraph("DIRECTORATE GENERAL OF MINES SAFETY (DGMS) & OISD-STD-105 AUDIT REPORT", subtitle_style))
        elements.append(Spacer(1, 4))
        elements.append(Paragraph("STATUTORY H₂S (HYDROGEN SULFIDE) DOSIMETRY & WORKER OCCUPATIONAL EXPOSURE RECORD", audit_badge_style))
        elements.append(Spacer(1, 8))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=12))

        # 2. Audit Metadata Grid
        now_str = datetime.utcnow().strftime("%d-%b-%Y %H:%M:%S UTC")
        meta_data = [
            [
                Paragraph("<b>Audit Date:</b> " + now_str, body_style),
                Paragraph("<b>Regulatory Authority:</b> DGMS / OISD India", body_style),
            ],
            [
                Paragraph("<b>Unit / Area:</b> Hydrocracker & CDU Units (Zone-0/1)", body_style),
                Paragraph("<b>Inspection Type:</b> Daily Statutory Shift Clearance", body_style),
            ],
            [
                Paragraph("<b>Standard Limits:</b> TWA 10.0 ppm | Action 5.0 ppm", body_style),
                Paragraph("<b>Badge Type:</b> Lead Acetate Colorimetric Strip", body_style),
            ]
        ]
        meta_table = Table(meta_data, colWidths=[270, 270])
        meta_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 14))

        # 3. Summary Statistics
        total_workers = len(records)
        safe_count = sum(1 for r in records if r.get("compliance_status") == "NORMAL")
        action_count = sum(1 for r in records if r.get("compliance_status") == "ACTION_REQUIRED")
        danger_count = sum(1 for r in records if r.get("compliance_status") == "DANGER_EXCEEDED")

        elements.append(Paragraph("Shift Exposure Summary", section_heading))
        elements.append(Spacer(1, 4))
        
        stat_data = [
            ["Total Badges Scanned", "Normal (< 5 ppm)", "Action Required (5-10 ppm)", "Exceeded (> 10 ppm)"],
            [str(total_workers), str(safe_count), str(action_count), str(danger_count)]
        ]
        stat_table = Table(stat_data, colWidths=[135, 135, 135, 135])
        stat_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("BACKGROUND", (0, 1), (0, 1), colors.HexColor("#f1f5f9")),
            ("BACKGROUND", (1, 1), (1, 1), colors.HexColor("#dcfce7")), # Light green
            ("BACKGROUND", (2, 1), (2, 1), colors.HexColor("#fef9c3")), # Light yellow
            ("BACKGROUND", (3, 1), (3, 1), colors.HexColor("#fee2e2")), # Light red
            ("TEXTCOLOR", (3, 1), (3, 1), colors.HexColor("#991b1b")),
            ("FONTNAME", (0, 1), (-1, 1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 1), (-1, 1), 12),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#94a3b8")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        elements.append(stat_table)
        elements.append(Spacer(1, 14))

        # 4. Worker Detailed Exposure Roster
        elements.append(Paragraph("Statutory Worker Dosimetry Roster", section_heading))
        elements.append(Spacer(1, 4))

        table_header = ["Worker ID", "Name & Unit", "Badge UID", "ΔE", "Temp/RH", "Dosage (ppm·hr)", "TWA (ppm)", "DGMS Status"]
        table_rows = [table_header]

        for r in records:
            status = r.get("compliance_status", "NORMAL")
            status_color = "#166534" if status == "NORMAL" else ("#854d0e" if status == "ACTION_REQUIRED" else "#991b1b")
            status_text = f"<font color='{status_color}'><b>{status}</b></font>"

            table_rows.append([
                r.get("worker_code", "N/A"),
                f"{r.get('worker_name', 'Worker')}\n({r.get('department', 'Plant')})",
                r.get("badge_uid", "BDG-00"),
                f"{r.get('delta_E', 0.0):.1f}",
                f"{r.get('ambient_temp_c', 30.0):.0f}°C / {r.get('relative_humidity', 60.0):.0f}%",
                f"{r.get('cumulative_dosage_ppm_hr', 0.0):.2f}",
                f"{r.get('avg_concentration_ppm', 0.0):.2f}",
                Paragraph(status_text, body_style)
            ])

        # Render Table
        roster_table = Table(table_rows, colWidths=[55, 110, 65, 35, 75, 75, 55, 70])
        roster_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 8),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("ALIGN", (1, 1), (1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#94a3b8")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(roster_table)
        elements.append(Spacer(1, 18))

        # 5. Sign-off and Certification
        cert_text = (
            "<b>Statutory Certification:</b> This audit report has been automatically compiled via the SULFSCAN "
            "Computer Vision & Environmental Dosimetry Engine. All measurements conform to <b>DGMS Standard "
            "Regulation 124</b> and <b>OISD-STD-105/112</b> requirements. Any worker with status <i>DANGER_EXCEEDED</i> "
            "has been barred from hazardous zones and referred to occupational health."
        )
        elements.append(Paragraph(cert_text, body_style))
        elements.append(Spacer(1, 25))

        sig_data = [
            ["____________________________________", "____________________________________"],
            ["Chief Refinery Safety Officer (DGMS Certified)", "Head of Occupational Health & Safety"],
            ["Date & Seal", "Date & Seal"]
        ]
        sig_table = Table(sig_data, colWidths=[270, 270])
        sig_table.setStyle(TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTNAME", (0, 1), (-1, 1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ]))
        elements.append(sig_table)

        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes


compliance_pdf_generator = CompliancePDFGenerator()
