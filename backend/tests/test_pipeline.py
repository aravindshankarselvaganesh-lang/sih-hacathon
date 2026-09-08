"""
End-to-End Pipeline Unit & Integration Tests
--------------------------------------------
Validates:
1. OpenCV badge generation, perspective warp, and LAB colorimetry.
2. AI calibration exposure regression calculation under varied temps and humidities.
3. DGMS and OISD safety threshold classification.
4. ReportLab PDF audit report generation and byte integrity.
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import numpy as np
import cv2

from app.services.cv_engine import cv_engine
from app.services.calibration_ai import calibration_ai
from app.services.compliance_reportlab import compliance_pdf_generator


def create_synthetic_badge_image(darkness: int = 120) -> bytes:
    """Generates a synthetic 500x500 badge image with white patch and darkened reactive strip."""
    img = np.ones((500, 500, 3), dtype=np.uint8) * 230  # Badge card body

    # White balance patch at top-left
    img[25:90, 25:90] = [250, 250, 250]

    # DataMatrix mock at bottom-right
    img[400:475, 400:475] = [20, 20, 20]

    # Reactive chemical strip at center (Lead Acetate / PbS darkening)
    img[175:325, 175:325] = [darkness, darkness, darkness]

    _, buffer = cv2.imencode(".png", img)
    return buffer.tobytes()


def test_cv_engine_processing():
    img_bytes = create_synthetic_badge_image(darkness=100)
    result = cv_engine.process_image_bytes(img_bytes)

    assert "extracted_L" in result
    assert "delta_E" in result
    assert result["extracted_L"] > 0
    assert result["delta_E"] > 0
    print(f"CV Test Passed: L*={result['extracted_L']}, delta_E={result['delta_E']}")


def test_ai_calibration_exposure():
    # Test safe exposure (< 5 ppm)
    safe_eval = calibration_ai.calculate_exposure(
        extracted_L=80.0,
        extracted_a=-1.0,
        extracted_b=6.0,
        delta_E=12.5,
        ambient_temp_c=28.0,
        relative_humidity=55.0,
        exposure_hours=8.0
    )
    assert safe_eval["compliance_status"] == "NORMAL"
    assert safe_eval["dgms_compliant"] is True

    # Test dangerous exposure (> 10 ppm)
    danger_eval = calibration_ai.calculate_exposure(
        extracted_L=40.0,
        extracted_a=8.0,
        extracted_b=15.0,
        delta_E=52.0,
        ambient_temp_c=35.0,
        relative_humidity=75.0,
        exposure_hours=8.0
    )
    assert danger_eval["compliance_status"] == "DANGER_EXCEEDED"
    assert danger_eval["dgms_compliant"] is False
    assert danger_eval["avg_concentration_ppm"] > 10.0


def test_reportlab_pdf_generation():
    demo_records = [
        {
            "worker_code": "WRK-1024",
            "worker_name": "Rahul Sharma",
            "department": "Hydrocracker Unit",
            "badge_uid": "BDG-7749-A",
            "delta_E": 14.2,
            "ambient_temp_c": 32.0,
            "relative_humidity": 60.0,
            "cumulative_dosage_ppm_hr": 22.4,
            "avg_concentration_ppm": 2.8,
            "compliance_status": "NORMAL"
        },
        {
            "worker_code": "WRK-3072",
            "worker_name": "Aman Kumar",
            "department": "Sulfur Recovery Unit",
            "badge_uid": "BDG-9901-C",
            "delta_E": 48.0,
            "ambient_temp_c": 34.0,
            "relative_humidity": 70.0,
            "cumulative_dosage_ppm_hr": 89.6,
            "avg_concentration_ppm": 11.2,
            "compliance_status": "DANGER_EXCEEDED"
        }
    ]

    pdf_bytes = compliance_pdf_generator.generate_dgms_oisd_report(demo_records)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF")
    print(f"ReportLab PDF Test Passed: Generated {len(pdf_bytes)} bytes PDF.")


if __name__ == "__main__":
    test_cv_engine_processing()
    test_ai_calibration_exposure()
    test_reportlab_pdf_generation()
    print("All backend tests passed successfully!")
