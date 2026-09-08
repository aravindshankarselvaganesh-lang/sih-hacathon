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
from typing import List, Tuple, Union


class AnalyticalDosimeterModel:
    """
    Analytical regression formulation mimicking the trained ONNX model
    for robust portable execution in environments without full ONNX toolchains.
    Operates both with NumPy and pure Python math library.
    """
    def __init__(self):
        self.k = 3.8

    def predict_single(
        self,
        delta_L: float,
        delta_a: float,
        delta_b: float,
        temp_c: float,
        rh_percent: float,
        duration_hours: float = 8.0
    ) -> Tuple[float, float]:
        """
        Calculates cumulative H2S dosage (ppm*hr) and shift average concentration (ppm).
        """
        duration = max(duration_hours, 0.1)

        # CIE Delta E (1976 formulation)
        delta_E = math.sqrt(delta_L**2 + delta_a**2 + delta_b**2)

        # Temperature & Humidity normalization factors (Arrhenius correction)
        t_corr = max(0.5, 1.0 + 0.012 * (temp_c - 25.0))
        rh_corr = max(0.5, 1.0 + 0.008 * (rh_percent - 50.0))

        # Inverted chemical kinetics
        normalized_E = delta_E / (self.k * t_corr * rh_corr)
        cumulative_dosage = normalized_E ** 2
        avg_ppm = cumulative_dosage / duration

        return round(cumulative_dosage, 2), round(avg_ppm, 2)


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
