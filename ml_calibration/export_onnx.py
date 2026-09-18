"""
H2S Dosimeter Chemical Calibration & ONNX Model Exporter
-------------------------------------------------------
Colorimetric chemical badges (e.g. Lead Acetate / organometallic complexes)
exhibit color changes in response to Hydrogen Sulfide (H2S) gas.

Reaction Kinetics:
- Rate of darkening (delta_E in CIE LAB color space) is a function of:
  * Cumulative dosage (ppm * hours)
  * Ambient Temperature (°C) - Arrhenius temperature dependence
  * Relative Humidity (%) - moisture catalyzes colorimetric reaction
  * Badge age / baseline degradation
"""

import math
from typing import List, Optional, Tuple, Union

# Unified occupational exposure limits (ppm) — keep in sync with
# backend/app/services/calibration_ai.py and
# mobile_app/lib/services/onnx_inference.dart.
# TWA = 8-hr Time-Weighted Average (10); ACTION = DGMS action level (5);
# STEL = 15-min window (15); IDLH = ceiling (100).
TWA_LIMIT_PPM = 10.0
ACTION_LEVEL_PPM = 5.0
STEL_LIMIT_PPM = 15.0
IDLH_LIMIT_PPM = 100.0

# Default activation energy for the Arrhenius temperature compensation
# (J/mol). Placeholder -- true Ea must be fitted from controlled lab
# calibration data (dosage vs temperature curves), not assumed.
DEFAULT_EA_J_PER_MOL = 50000.0
GAS_CONSTANT_R = 8.314  # J/(mol*K)
T_REF_KELVIN = 298.15  # 25 C reference temperature


class AnalyticalDosimeterModel:
    """
    Analytical regression formulation mimicking the trained ONNX model
    for robust portable execution in environments without full ONNX toolchains.
    Operates both with NumPy and pure Python math library.
    Operates both with NumPy and pure Python math library.

    Compensated kinetic model (documented empirical form):
      delta_E = k * sqrt(dosage) * factor_T * factor_RH
    where factor_T is an Arrhenius-style exponential in 1/T and
    factor_RH is a first-order humidity correction clamped to [0.5, 1.5].
    NOTE: true Arrhenius behaviour needs Ea fitting from lab data; the
    default Ea=50000 J/mol below is a placeholder, not a measured value.
    """
    def __init__(self, k: float = 3.8, ea_j_per_mol: float = DEFAULT_EA_J_PER_MOL):
        if not math.isfinite(k) or k <= 0:
            raise ValueError(f"k must be finite and > 0, got {k!r}")
        if not math.isfinite(ea_j_per_mol) or ea_j_per_mol <= 0:
            raise ValueError(f"Ea must be finite and > 0, got {ea_j_per_mol!r}")
        self.k = float(k)
        self.ea_j_per_mol = float(ea_j_per_mol)

    def _arrhenius_factor_T(self, temp_c: float) -> float:
        """Exp-based Arrhenius factor; Ea placeholder until fitted (see note above)."""
        temp_k = float(temp_c) + 273.15
        if not math.isfinite(temp_k) or temp_k <= 0:
            raise ValueError(f"temperature must yield finite T>0 K, got {temp_c!r}")
        return math.exp(-self.ea_j_per_mol / GAS_CONSTANT_R * (1.0 / temp_k - 1.0 / T_REF_KELVIN))

    def predict_single(
        self,
        delta_L: float,
        delta_a: float,
        delta_b: float,
        temp_c: float,
        rh_percent: float,
        duration_hours: float = 8.0,
        stel_peak: Optional[float] = None,
    ) -> Tuple[float, float]:
        """
        Calculates cumulative H2S dosage (ppm*hr) and shift average concentration (ppm).

        stel_peak (optional float, ppm): STEL stub kept for API parity with
        backend/app/services/calibration_ai.py and
        mobile_app/lib/services/onnx_inference.dart. If provided and
        > STEL_LIMIT_PPM (15.0), call classify_compliance(avg_ppm, stel_peak)
        to get STEL_EXCEEDED. Numeric (dosage, avg) return is unchanged so
        existing callers are not broken.

        Raises ValueError on non-finite inputs, delta_E < 0, duration <= 0, or k <= 0.
        No silent duration flooring is applied (fail-closed on bad duration).
        """
        for name, val in (
            ("delta_L", delta_L), ("delta_a", delta_a), ("delta_b", delta_b),
            ("temp_c", temp_c), ("rh_percent", rh_percent),
            ("duration_hours", duration_hours),
        ):
            if not math.isfinite(float(val)):
                raise ValueError(f"{name} must be finite, got {val!r}")
        if not math.isfinite(self.k) or self.k <= 0:
            raise ValueError(f"k must be finite and > 0, got {self.k!r}")
        if duration_hours <= 0:
            raise ValueError(f"duration_hours must be > 0, got {duration_hours!r}")
        duration = float(duration_hours)

        # CIE Delta E (1976 formulation)
        delta_E = math.sqrt(delta_L**2 + delta_a**2 + delta_b**2)
        if not math.isfinite(delta_E) or delta_E < 0:
            raise ValueError(f"computed delta_E must be finite and >= 0, got {delta_E!r}")

        # Documented compensated model: Arrhenius-style exponential in
        # temperature (true Arrhenius needs Ea fitting; Ea=50000 default is
        # a placeholder) + first-order empirical humidity correction.
        t_corr = self._arrhenius_factor_T(temp_c)
        if not math.isfinite(t_corr) or t_corr <= 0:
            raise ValueError(f"temperature factor must be finite and > 0, got {t_corr!r}")
        t_corr = min(max(t_corr, 0.5), 2.0)
        rh_corr = 1.0 + 0.008 * (float(rh_percent) - 50.0)
        rh_corr = min(max(rh_corr, 0.5), 1.5)

        # Inverted chemical kinetics
        normalized_E = delta_E / (self.k * t_corr * rh_corr)
        cumulative_dosage = normalized_E ** 2
        avg_ppm = cumulative_dosage / duration

        # Validate optional STEL peak stub early (fail-closed on non-finite).
        if stel_peak is not None and not math.isfinite(float(stel_peak)):
            raise ValueError(f"stel_peak must be finite or None, got {stel_peak!r}")

        return round(cumulative_dosage, 2), round(avg_ppm, 2)


def classify_compliance(avg_ppm: float, stel_peak: Optional[float] = None) -> str:
    """Unified compliance classifier (mirrors calibration_ai + Dart).

    Returns STEL_EXCEEDED if stel_peak is provided and > STEL_LIMIT_PPM
    (15.0); otherwise TWA-based NORMAL / ACTION_REQUIRED / DANGER_EXCEEDED
    using TWA_LIMIT_PPM (10.0) / ACTION_LEVEL_PPM (5.0).
    """
    if stel_peak is not None and math.isfinite(float(stel_peak)) and float(stel_peak) > STEL_LIMIT_PPM:
        return "STEL_EXCEEDED"
    avg = float(avg_ppm)
    if avg < ACTION_LEVEL_PPM:
        return "NORMAL"
    if avg <= TWA_LIMIT_PPM:
        return "ACTION_REQUIRED"
    return "DANGER_EXCEEDED"


if __name__ == "__main__":
    model = AnalyticalDosimeterModel()
    # Sample badge with moderate darkening: delta_L = -18.5, delta_a = 5.2, delta_b = 7.8
    dosage, avg_ppm = model.predict_single(
        delta_L=-18.5,
        delta_a=5.2,
        delta_b=7.8,
        temp_c=32.0,
        rh_percent=65.0,
        duration_hours=8.0
    )
    print("=== H2S Dosimeter Calibration Evaluation ===")
    print(f"Inputs: dL=-18.5, da=5.2, db=7.8, Temp=32 deg C, RH=65%, Shift=8 hrs")
    print(f"Cumulative Dosage: {dosage} ppm*hr")
    print(f"Shift TWA H2S Concentration: {avg_ppm} ppm")
    print(f"Compliance: {'SAFE (< 5 ppm)' if avg_ppm < 5.0 else ('WARNING (5-10 ppm)' if avg_ppm <= 10.0 else 'DANGER (> 10 ppm)')}")
