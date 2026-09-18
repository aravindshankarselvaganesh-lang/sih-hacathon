"""
Badge Color Calibration Chart & Reference Values
------------------------------------------------
Defines standard RGB and CIE LAB reference color patches printed on
the border of every physical dosimeter badge:
- White Balance Reference: (96.5, -0.2, 0.5) in LAB
- Neutral 50% Gray: (53.6, -0.1, -0.2)
- Deep Black: (10.2, 0.0, 0.1)
- Baseline Virgin Chemical Strip: Lead acetate white/cream (92.8, -1.2, 5.4)

When exposed to H2S gas, Lead(II) Acetate forms Lead(II) Sulfide (PbS):
Pb(C2H3O2)2 + H2S -> PbS (brown/black precipitate) + 2 CH3COOH
"""

REFERENCE_COLOR_CHART = {
    "white_patch": {
        "rgb": (245, 245, 245),
        "lab": (96.5, -0.2, 0.5),
        "description": "Illumination normalization reference"
    },
    "gray_patch": {
        "rgb": (128, 128, 128),
        "lab": (53.6, -0.1, -0.2),
        "description": "Midtone linearity reference"
    },
    "black_patch": {
        "rgb": (25, 25, 25),
        "lab": (10.2, 0.0, 0.1),
        "description": "Shadow clip reference"
    },
    "virgin_strip": {
        "rgb": (238, 236, 225),
        "lab": (92.8, -1.2, 5.4),
        "description": "Unexposed reactive chemical matrix"
    }
}

# DGMS (Directorate General of Mines Safety) & OISD Threshold Limits (ppm)
THRESHOLDS = {
    "TWA_LIMIT": 10.0,         # Time-Weighted Average (8-hour shift)
    "STEL_LIMIT": 15.0,        # Short-Term Exposure Limit (15-minute exposure)
    "IDLH_LIMIT": 100.0,       # Immediately Dangerous to Life or Health
    "ACTION_LEVEL": 5.0        # Action Level requiring engineering controls
}

# Exposure-limit time windows: limit name -> (ppm threshold, averaging window).
# STEL is a 15-minute window; IDLH is a ceiling (no safe duration above it).
THRESHOLD_TIME_WINDOWS = {
    "TWA": (10.0, "8h"),
    "STEL": (15.0, "15min"),
    "IDLH": (100.0, "ceiling"),
    "ACTION": (5.0, "8h"),
}

# Per-LOT calibration registry: LOT -> virgin (unexposed) CIE LAB + k
# sensitivity factor for the Arrhenius kinetic model
# (delta_E = k * sqrt(dosage) * factor_T * factor_RH).
# Example lots below; extend with lab-fitted values per production batch.
CALIBRATION_REGISTRY = {
    "LOT-2025-01": {
        "virgin_lab": (92.8, -1.2, 5.4),
        "k": 3.8,
        "description": "Lead acetate baseline lot Jan-2025",
    },
    "LOT-2025-02": {
        "virgin_lab": (91.5, -0.8, 6.1),
        "k": 3.6,
        "description": "Lead acetate recalibrated lot Feb-2025",
    },
}

DEFAULT_CALIBRATION = {
    "virgin_lab": (92.8, -1.2, 5.4),
    "k": 3.8,
}


def get_calibration_for_lot(batch_lot: str):
    """Loader for per-LOT calibration.

    Returns {"virgin_lab": (L, a, b), "k": float} for a known LOT, else the
    default virgin LAB + k=3.8. Never raises on unknown LOT (fail-open to
    default; caller may warn).
    """
    if isinstance(batch_lot, str) and batch_lot.strip() in CALIBRATION_REGISTRY:
        entry = CALIBRATION_REGISTRY[batch_lot.strip()]
        return {"virgin_lab": entry["virgin_lab"], "k": entry["k"]}
    return dict(DEFAULT_CALIBRATION)
