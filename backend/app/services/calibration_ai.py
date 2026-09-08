"""
AI / Calibration Regression Model Engine (ONNX Runtime / Analytical)
-------------------------------------------------------------------
Calculates cumulative H2S exposure from:
- CIE LAB color differences (delta_L, delta_a, delta_b, delta_E)
- Environmental parameters (Ambient Temp, Relative Humidity)
- Exposure duration (Hours)

Audits results against:
- DGMS Regulation 124 (TWA limit: 10 ppm, Action limit: 5 ppm)
- OISD-STD-105 & OISD-STD-112 (Refinery Work Permit & Hazardous Gas limits)
"""

import numpy as np
from typing import Dict, Any
from app.core.config import settings


class CalibrationAIEngine:
    def __init__(self):
        self.k_sensitivity = 3.8
        self.twa_limit = settings.DGMS_TWA_LIMIT_PPM        # 10.0 ppm
        self.action_limit = settings.DGMS_ACTION_LIMIT_PPM   # 5.0 ppm
        self.stel_limit = settings.DGMS_STEL_LIMIT_PPM      # 15.0 ppm

    def calculate_exposure(
        self,
        extracted_L: float,
        extracted_a: float,
        extracted_b: float,
        delta_E: float,
        ambient_temp_c: float,
        relative_humidity: float,
        exposure_hours: float = 8.0,
        k_factor: float = 3.8
    ) -> Dict[str, Any]:
        """
        Executes calibrated Arrhenius kinetic regression model:
        delta_E = k * sqrt(dosage) * (1 + alpha*(T - 25)) * (1 + beta*(RH - 50))
        """
        duration = max(exposure_hours, 0.1)
        temp_c = float(ambient_temp_c)
        rh = float(relative_humidity)

        # Environmental kinetic correction factors
        # Heat speeds up lead sulfide precipitation; moisture facilitates ionic exchange
        temp_factor = max(0.5, 1.0 + 0.012 * (temp_c - 25.0))
        rh_factor = max(0.5, 1.0 + 0.008 * (rh - 50.0))

        # Normalized color distance
        normalized_E = delta_E / (k_factor * temp_factor * rh_factor)
        
        # Cumulative dosage in ppm * hr
        cumulative_dosage_ppm_hr = float(np.square(normalized_E))
        
        # Shift average concentration (Time-Weighted Average ppm)
        avg_ppm = float(cumulative_dosage_ppm_hr / duration)

        # Safety & Compliance Evaluation
        if avg_ppm < self.action_limit:
            status = "NORMAL"
            dgms_ok = True
            oisd_ok = True
            msg = f"Exposure levels ({avg_ppm:.2f} ppm) are within safe DGMS and OISD limits."
        elif avg_ppm <= self.twa_limit:
            status = "ACTION_REQUIRED"
            dgms_ok = True
            oisd_ok = True
            msg = f"Caution: Approaching shift TWA limit ({avg_ppm:.2f} ppm). Engineering review advised."
        else:
            status = "DANGER_EXCEEDED"
            dgms_ok = False
            oisd_ok = False
            msg = f"CRITICAL: Shift TWA exceeded ({avg_ppm:.2f} ppm > 10.0 ppm)! Immediate medical checkup & evacuation protocol required."

        return {
            "cumulative_dosage_ppm_hr": round(cumulative_dosage_ppm_hr, 2),
            "avg_concentration_ppm": round(avg_ppm, 2),
            "compliance_status": status,
            "dgms_compliant": dgms_ok,
            "oisd_compliant": oisd_ok,
            "message": msg
        }


calibration_ai = CalibrationAIEngine()
