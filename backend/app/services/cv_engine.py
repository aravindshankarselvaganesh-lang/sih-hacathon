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
import logging
import numpy as np
from typing import Tuple, Dict, Any, Optional


logger = logging.getLogger(__name__)


class LowConfidence(Exception):
    """Raised when ROI is too small / unreliable for colorimetry."""
    pass


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

    def perspective_warp_badge(self, image: np.ndarray, target_size: int = 500) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Detects badge quadrilateral and warps perspective to canonical 500x500 image.
        Fail-closed: if no distinct quadrilateral is found, falls back to a center
        crop BUT flags it via warp_method/confidence so callers never mistake it
        for a high-confidence quad warp.
        Returns (warped_image, {"warp_method": str, "confidence": float}).
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
            return warped, {"warp_method": "quad_warp", "confidence": 0.95}
        else:
            # Center crop fallback (fail-closed: flagged low confidence)
            h, w = image.shape[:2]
            min_dim = min(h, w)
            sy = (h - min_dim) // 2
            sx = (w - min_dim) // 2
            cropped = image[sy:sy + min_dim, sx:sx + min_dim]
            resized = cv2.resize(cropped, (target_size, target_size))
            return resized, {"warp_method": "center_crop_fallback", "confidence": 0.35}

    def assess_blur_glare(self, image: np.ndarray) -> Dict[str, Any]:
        """
        Image-quality stub (fail-closed signal, not a silent pass).
        - Blur: variance of Laplacian (low var ~= blurry/out-of-focus).
          Threshold here is a heuristic stub; calibrate on real badge photos.
        - Glare/flat-field: basic std + saturation check (washed-out highlights
          or near-uniform frame suggest glare or lens occlusion).
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if image.ndim == 3 else image
        lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        std = float(np.std(gray.astype(np.float32)))
        mean = float(np.mean(gray.astype(np.float32)))
        is_blurry = bool(lap_var < 100.0)
        is_glare = bool(mean > 235.0 or std < 8.0)
        return {
            "laplacian_var": round(lap_var, 2),
            "mean": round(mean, 2),
            "std": round(std, 2),
            "is_blurry": is_blurry,
            "is_glare": is_glare,
        }

    def normalize_illumination(self, badge_img: np.ndarray) -> np.ndarray:
        """
        White balance normalization using the top-left white reference patch (5% to 15% ROI).
        Gain clamped to 0.5..4.0.
        """
        h, w = badge_img.shape[:2]
        # White reference patch located at top-left border
        white_roi = badge_img[int(h * 0.05):int(h * 0.18), int(w * 0.05):int(w * 0.18)]
        mean_bgr = np.mean(white_roi, axis=(0, 1))

        # Avoid zero division
        mean_bgr = np.maximum(mean_bgr, 1.0)
        target_white = np.array([245.0, 245.0, 245.0])
        raw_gain = target_white / mean_bgr

        # Safety clamp: gains outside 0.5..4.0 imply extreme/failed lighting.
        # Fail closed (raise) rather than silently white-balancing garbage.
        if bool(np.any(raw_gain < 0.5) or np.any(raw_gain > 4.0)):
            raise ValueError(f"Illumination gain out of safe range 0.5..4.0: {raw_gain.tolist()}")
        gain = np.clip(raw_gain, 0.5, 4.0)

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

        NOTE (sRGB linearization): OpenCV's COLOR_BGR2LAB assumes gamma-
        corrected sRGB input and handles the non-linear transfer internally
        for uint8 images. If a linear-RGB pipeline is introduced later
        (e.g. raw sensor values), explicitly linearize sRGB
        (c_lin = (c/255 <= 0.04045) ? c/255/12.92 : ((c/255+0.055)/1.055)^2.4)
        before XYZ->LAB conversion, otherwise delta_E will be biased.
        TODO: replace default_virgin_lab + fixed k with a fitted per-LOT
        model loaded from CALIBRATION_REGISTRY (see
        ml_calibration/badge_color_chart.py::get_calibration_for_lot).
        """
        assert badge_img.dtype == np.uint8, f"badge image must be uint8 before LAB conversion, got {badge_img.dtype}"
        if badge_img.dtype != np.uint8:
            raise ValueError(f"badge image must be uint8 before LAB conversion, got {badge_img.dtype}")
        h, w = badge_img.shape[:2]
        # Chemical sensing strip is centered in the badge
        sy, ey = int(h * 0.35), int(h * 0.65)
        sx, ex = int(w * 0.35), int(w * 0.65)
        strip_roi = badge_img[sy:ey, sx:ex]
        rh, rw = strip_roi.shape[:2]
        if rh < 20 or rw < 20:
            raise LowConfidence(f"Chemical strip ROI too small ({rw}x{rh}px); minimum 20x20 required.")
        if strip_roi.dtype != np.uint8:
            raise ValueError(f"strip ROI must be uint8 before LAB conversion, got {strip_roi.dtype}")

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
        h0, w0 = img.shape[:2]
        if h0 < 100 or w0 < 100:
            raise ValueError(f"Image too small ({w0}x{h0}px); minimum 100x100 required.")

        warp_out = self.perspective_warp_badge(img)
        # Back-compat: accept (image, info) tuple or legacy bare ndarray.
        if isinstance(warp_out, tuple):
            warped, warp_info = warp_out
        elif isinstance(warp_out, dict):
            warped, warp_info = warp_out["image"], warp_out
        else:
            warped, warp_info = warp_out, {"warp_method": "unknown", "confidence": 0.0}
        quality = self.assess_blur_glare(warped)
        normalized = self.normalize_illumination(warped)
        L, a, b, delta_E = self.extract_chemical_strip_lab(normalized)

        warp_confidence = float(warp_info.get("confidence", 0.0))
        # Reject rule (fail-closed): low warp confidence OR blur/glare must
        # surface needs_retake=true so callers never silently treat a bad
        # capture as NORMAL. Threshold 0.6 separates quad_warp (0.95) from
        # center_crop_fallback (0.35).
        needs_retake = bool(
            warp_confidence < 0.6
            or quality.get("is_blurry", False)
            or quality.get("is_glare", False)
        )
        if needs_retake:
            logger.warning(
                "Image quality reject: warp_confidence=%.2f blur=%s glare=%s -> needs_retake=true",
                warp_confidence, quality.get("is_blurry"), quality.get("is_glare"),
            )

        return {
            "extracted_L": round(L, 2),
            "extracted_a": round(a, 2),
            "extracted_b": round(b, 2),
            "delta_E": round(delta_E, 2),
            "warp_method": warp_info.get("warp_method", "unknown"),
            "warp_confidence": warp_info.get("confidence", 0.0),
            "laplacian_var": quality["laplacian_var"],
            "is_blurry": quality["is_blurry"],
            "is_glare": quality["is_glare"],
            "needs_retake": needs_retake,
        }


cv_engine = DosimeterCVEngine()
