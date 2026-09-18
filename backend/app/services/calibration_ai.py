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

import logging
import math
import numpy as np
from typing import Dict, Any, Optional
from app.core.config import settings


logger = logging.getLogger(__name__)

# Unified occupational limits (ppm) — keep in sync with
# ml_calibration/export_onnx.py and mobile_app/lib/services/onnx_inference.dart.
# TWA = 8-hr Time-Weighted Average; ACTION = DGMS action level;
# STEL = 15-min window; IDLH = ceiling (no safe duration above it).
TWA_LIMIT_PPM = 10.0
ACTION_LEVEL_PPM = 5.0
STEL_LIMIT_PPM = 15.0
IDLH_LIMIT_PPM = 100.0
# Fallback occupational limits (ppm) if settings lack them (aliases above).
STEL_LIMIT_FALLBACK_PPM = STEL_LIMIT_PPM
IDLH_LIMIT_FALLBACK_PPM = IDLH_LIMIT_PPM
# Default Arrhenius activation energy placeholder (J/mol).
# NOTE: true Arrhenius behaviour needs Ea fitting from controlled lab
# calibration data; Ea=50000 is a placeholder, not a measured value.
DEFAULT_EA_J_PER_MOL = 50000.0
GAS_CONSTANT_R = 8.314
T_REF_KELVIN = 298.15


class CalibrationAIEngine:
    def __init__(self):
        self.k_sensitivity = 3.8
        self.ea_j_per_mol = DEFAULT_EA_J_PER_MOL
        self.twa_limit = settings.DGMS_TWA_LIMIT_PPM        # 10.0 ppm
        self.action_limit = settings.DGMS_ACTION_LIMIT_PPM   # 5.0 ppm
        self.stel_limit = getattr(settings, "DGMS_STEL_LIMIT_PPM", STEL_LIMIT_PPM)  # 15.0 ppm
        self.idlh_limit = getattr(settings, "DGMS_IDLH_LIMIT_PPM", IDLH_LIMIT_PPM)  # 100.0 ppm

    def _arrhenius_factor_T(self, temp_c: float) -> float:
        """Exp-based Arrhenius factor; Ea placeholder until fitted (see note above)."""
        temp_k = float(temp_c) + 273.15
        if not math.isfinite(temp_k) or temp_k <= 0:
            raise ValueError(f"temperature must yield finite T>0 K, got {temp_c!r}")
        return math.exp(-self.ea_j_per_mol / GAS_CONSTANT_R * (1.0 / temp_k - 1.0 / T_REF_KELVIN))

    def calculate_exposure(
        self,
        extracted_L: float,
        extracted_a: float,
        extracted_b: float,
        delta_E: float,
        ambient_temp_c: float,
        relative_humidity: float,
        exposure_hours: float = 8.0,
        k_factor: float = 3.8,
        stel_peak: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Executes calibrated Arrhenius kinetic regression model:
        delta_E = k * sqrt(dosage) * factor_T * factor_RH
        where factor_T is an Arrhenius-style exp in 1/T (true Arrhenius
        needs Ea fitting; Ea=50000 default is a placeholder) and factor_RH
        is a first-order humidity correction clamped to [0.5, 1.5].

        stel_peak (optional float, ppm): 15-min peak stub. If provided and
        > STEL limit (15.0 ppm), status is forced to STEL_EXCEEDED
        regardless of 8-hr TWA. Optional so existing callers are unaffected.

        Raises ValueError on non-finite inputs, delta_E < 0,
        exposure_hours <= 0, or k_factor <= 0. No silent duration flooring.
        """
        if not math.isfinite(float(delta_E)) or float(delta_E) < 0:
            raise ValueError(f"delta_E must be finite and >= 0, got {delta_E!r}")
        if not math.isfinite(float(exposure_hours)) or not (0 < float(exposure_hours) <= 24):
            raise ValueError(f"exposure_hours must satisfy 0 < hours <= 24, got {exposure_hours!r}")
        if not math.isfinite(float(ambient_temp_c)) or not (-20 <= float(ambient_temp_c) <= 60):
            raise ValueError(f"ambient_temp_c must be in [-20, 60], got {ambient_temp_c!r}")
        if not math.isfinite(float(relative_humidity)) or not (0 <= float(relative_humidity) <= 100):
            raise ValueError(f"relative_humidity must be in [0, 100], got {relative_humidity!r}")
        if not math.isfinite(float(k_factor)) or float(k_factor) <= 0:
            raise ValueError(f"k_factor must be finite and > 0, got {k_factor!r}")
        for name, val in (("extracted_L", extracted_L), ("extracted_a", extracted_a),
                          ("extracted_b", extracted_b), ("ambient_temp_c", ambient_temp_c),
                          ("relative_humidity", relative_humidity)):
            if not math.isfinite(float(val)):
                raise ValueError(f"{name} must be finite, got {val!r}")
        duration = float(exposure_hours)
        temp_c = float(ambient_temp_c)
        rh = float(relative_humidity)

        # Documented compensated model: Arrhenius-style exponential in
        # temperature + first-order empirical humidity correction.
        # Heat speeds up lead sulfide precipitation; moisture facilitates ionic exchange
        temp_factor = self._arrhenius_factor_T(temp_c)
        if not math.isfinite(temp_factor) or temp_factor <= 0:
            raise ValueError(f"temperature factor must be finite and > 0, got {temp_factor!r}")
        temp_factor = min(max(temp_factor, 0.5), 2.0)
        rh_factor = min(max(1.0 + 0.008 * (rh - 50.0), 0.5), 1.5)

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
            msg = f"CRITICAL: Shift TWA exceeded ({avg_ppm:.2f} ppm > {self.twa_limit:.1f} ppm)! Immediate medical checkup & evacuation protocol required."

        # STEL peak stub (optional): 15-min peak over STEL_LIMIT forces
        # STEL_EXCEEDED fail-closed, independent of 8-hr TWA outcome.
        if stel_peak is not None:
            try:
                peak = float(stel_peak)
            except (TypeError, ValueError):
                raise ValueError(f"stel_peak must be a finite float or None, got {stel_peak!r}")
            if not math.isfinite(peak):
                raise ValueError(f"stel_peak must be finite or None, got {stel_peak!r}")
            if peak > self.stel_limit:
                status = "STEL_EXCEEDED"
                dgms_ok = False
                oisd_ok = False
                msg = (
                    f"CRITICAL: 15-min STEL peak {peak:.2f} ppm > {self.stel_limit:.1f} ppm! "
                    "Evacuate area & follow STEL response protocol."
                )

        logger.info(
            "Exposure calculated: delta_E=%.2f hours=%.2f temp=%.1fC RH=%.1f%% dosage=%.2f avg=%.2f status=%s",
            float(delta_E), float(exposure_hours), float(ambient_temp_c),
            float(relative_humidity), cumulative_dosage_ppm_hr, avg_ppm, status,
        )

        return {
            "cumulative_dosage_ppm_hr": round(cumulative_dosage_ppm_hr, 2),
            "avg_concentration_ppm": round(avg_ppm, 2),
            "compliance_status": status,
            "dgms_compliant": dgms_ok,
            "oisd_compliant": oisd_ok,
            "message": msg
        }


calibration_ai = CalibrationAIEngine()
