"""
OpenCV Computer Vision Engine for Colorimetric Dosimeter Badges
--------------------------------------------------------------
Functions:
1. Segmentation & Perspective Warping:
   - Detects the quadrilateral badge boundary using contour approximation.
   - Warps the badge into an orthogonal canonical square (500x500 px).
2. Ambient Illumination Normalization (White Balance & Color Space Transform):
   - Samples the printed white reference patch to calculate illuminant color cast.
   - Applies von Kries diagonal color correction / Gray-World normalization.
3. CIE L*a*b* Extraction:
   - Converts the normalized ROI of the reactive chemical strip to CIE 1976 L*a*b*.
   - Calculates Euclidean color difference delta_E from baseline virgin state:
     delta_E = sqrt((L - L0)^2 + (a - a0)^2 + (b - b0)^2)
"""

import cv2
import numpy as np
from typing import Tuple, Dict, Any, Optional


class DosimeterCVEngine:
    def __init__(self):
        # Default canonical virgin strip reference (Lead Acetate unexposed)
        self.default_virgin_lab = np.array([92.8, -1.2, 5.4], dtype=np.float32)

    def order_points(self, pts: np.ndarray) -> np.ndarray:
        """Orders 4 points as: top-left, top-right, bottom-right, bottom-left."""
        rect = np.zeros((4, 2), dtype="float32")
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]

        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]
        return rect

    def perspective_warp_badge(self, image: np.ndarray, target_size: int = 500) -> np.ndarray:
        """
        Detects badge quadrilateral and warps perspective to canonical 500x500 image.
        If no distinct quadrilateral is found, crops center square smoothly.
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edged = cv2.Canny(blurred, 50, 150)

        contours, _ = cv2.findContours(edged, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        badge_cnt = None

        for cnt in sorted(contours, key=cv2.contourArea, reverse=True)[:5]:
            peri = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
            if len(approx) == 4 and cv2.contourArea(cnt) > (image.shape[0] * image.shape[1] * 0.15):
                badge_cnt = approx
                break

        if badge_cnt is not None:
            pts = badge_cnt.reshape(4, 2).astype("float32")
            rect = self.order_points(pts)
            dst = np.array([
                [0, 0],
                [target_size - 1, 0],
                [target_size - 1, target_size - 1],
                [0, target_size - 1]
            ], dtype="float32")

            M = cv2.getPerspectiveTransform(rect, dst)
            warped = cv2.warpPerspective(image, M, (target_size, target_size))
            return warped
        else:
            # Center crop fallback
            h, w = image.shape[:2]
            min_dim = min(h, w)
            sy = (h - min_dim) // 2
            sx = (w - min_dim) // 2
            cropped = image[sy:sy + min_dim, sx:sx + min_dim]
            return cv2.resize(cropped, (target_size, target_size))

    def normalize_illumination(self, badge_img: np.ndarray) -> np.ndarray:
        """
        White balance normalization using the top-left white reference patch (5% to 15% ROI).
        """
        h, w = badge_img.shape[:2]
        # White reference patch located at top-left border
        white_roi = badge_img[int(h * 0.05):int(h * 0.18), int(w * 0.05):int(w * 0.18)]
        mean_bgr = np.mean(white_roi, axis=(0, 1))

        # Avoid zero division
        mean_bgr = np.maximum(mean_bgr, 1.0)
        target_white = np.array([245.0, 245.0, 245.0])
        gain = target_white / mean_bgr

        # Apply channel gains and clip
        normalized = np.zeros_like(badge_img, dtype=np.float32)
        for c in range(3):
            normalized[:, :, c] = np.clip(badge_img[:, :, c] * gain[c], 0, 255)

        return normalized.astype(np.uint8)

    def extract_chemical_strip_lab(self, badge_img: np.ndarray) -> Tuple[float, float, float, float]:
        """
        Extracts the center reactive chemical strip, converts to CIE LAB,
        and computes delta_E from baseline virgin unexposed strip.
        Returns: (L*, a*, b*, delta_E)
        """
        h, w = badge_img.shape[:2]
        # Chemical sensing strip is centered in the badge
        sy, ey = int(h * 0.35), int(h * 0.65)
        sx, ex = int(w * 0.35), int(w * 0.65)
        strip_roi = badge_img[sy:ey, sx:ex]

        # Convert BGR -> CIE LAB (OpenCV scales L to 0..255, a,b to 0..255)
        lab_roi = cv2.cvtColor(strip_roi, cv2.COLOR_BGR2LAB)
        mean_lab_cv = np.mean(lab_roi, axis=(0, 1))

        # Standardize OpenCV LAB to standard CIE 1976 scales:
        # L* in [0, 100], a* in [-128, 127], b* in [-128, 127]
        std_L = float(mean_lab_cv[0] * 100.0 / 255.0)
        std_a = float(mean_lab_cv[1] - 128.0)
        std_b = float(mean_lab_cv[2] - 128.0)

        curr_lab = np.array([std_L, std_a, std_b], dtype=np.float32)
        diff = curr_lab - self.default_virgin_lab
        delta_E = float(np.sqrt(np.sum(np.square(diff))))

        return std_L, std_a, std_b, delta_E

    def process_image_bytes(self, image_bytes: bytes) -> Dict[str, Any]:
        """Full pipeline from raw camera photo bytes to colorimetric metrics."""
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Invalid image buffer: could not decode image.")

        warped = self.perspective_warp_badge(img)
        normalized = self.normalize_illumination(warped)
        L, a, b, delta_E = self.extract_chemical_strip_lab(normalized)

        return {
            "extracted_L": round(L, 2),
            "extracted_a": round(a, 2),
            "extracted_b": round(b, 2),
            "delta_E": round(delta_E, 2),
        }


cv_engine = DosimeterCVEngine()
