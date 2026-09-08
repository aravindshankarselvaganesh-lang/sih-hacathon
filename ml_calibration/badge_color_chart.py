"""
Badge Color Calibration Chart & Reference Values
------------------------------------------------
Defines standard RGB and CIE LAB reference color patches printed on
the border of every physical dosimeter badge:
- White Balance Reference: (95.0, 0.0, 0.0) in LAB
- Neutral 50% Gray: (50.0, 0.0, 0.0)
- Deep Black: (5.0, 0.0, 0.0)
- Baseline Virgin Chemical Strip: Lead acetate white/cream (92.0, -1.5, 4.0)

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
