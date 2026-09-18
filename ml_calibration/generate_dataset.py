"""
Synthetic & Augmented Dataset Generator for H2S Colorimetric Dosimeters
----------------------------------------------------------------------
Generates realistic dosimeter badge images simulating:
- Variable H2S exposure (0 to 50 ppm)
- Arrhenius chemical reaction kinetics (PbS brown/black darkening)
- Environmental conditions (temperature 15-45C, humidity 20-90%)
- Ambient plant lighting casts (tungsten, daylight, cool LED)
- Camera artifacts (sensor noise, slight perspective rotation, blur)
"""

import os
import cv2
import csv
import math
import random
import argparse
import numpy as np


def ppm_to_strip_bgr(ppm: float, temp_c: float, rh: float) -> np.ndarray:
    """
    Computes reactive chemical strip color (BGR) as a function of H2S ppm,
    ambient temperature, and relative humidity using chemical kinetics.
    """
    k_env = (1.0 + 0.012 * (temp_c - 25.0)) * (1.0 + 0.008 * (rh - 50.0))
    effective_dose = max(0.0, ppm * k_env)
    
    t = min(1.0, math.sqrt(effective_dose / 50.0))
    
    if t < 0.25:
        alpha = t / 0.25
        bgr = (1.0 - alpha) * np.array([220, 240, 245]) + alpha * np.array([130, 185, 230])
    elif t < 0.6:
        alpha = (t - 0.25) / 0.35
        bgr = (1.0 - alpha) * np.array([130, 185, 230]) + alpha * np.array([45, 80, 130])
    else:
        alpha = (t - 0.6) / 0.4
        bgr = (1.0 - alpha) * np.array([45, 80, 130]) + alpha * np.array([25, 28, 35])
        
    return np.clip(bgr, 0, 255).astype(np.uint8)


def generate_badge_image(ppm: float, temp_c: float, rh: float, size: int = 500) -> np.ndarray:
    """Draws a realistic 500x500 dosimeter badge with white reference and reactive strip."""
    badge = np.ones((size, size, 3), dtype=np.uint8) * random.randint(225, 235)
    
    # Printed border
    cv2.rectangle(badge, (15, 15), (size - 15, size - 15), (40, 40, 40), 2)
    
    # 1. White balance reference patch (top-left)
    white_val = random.randint(248, 255)
    cv2.rectangle(badge, (30, 30), (100, 100), (white_val, white_val, white_val), -1)
    cv2.rectangle(badge, (30, 30), (100, 100), (80, 80, 80), 1)
    
    # 2. Neutral 50% Gray patch (top-right)
    cv2.rectangle(badge, (size - 100, 30), (size - 30, 100), (128, 128, 128), -1)
    
    # 3. Simulated 2D DataMatrix barcode patch (bottom-right)
    matrix_box = np.zeros((80, 80, 3), dtype=np.uint8) + 240
    for y in range(0, 80, 8):
        for x in range(0, 80, 8):
            if random.random() > 0.45 or x == 0 or y == 72:
                matrix_box[y:y+8, x:x+8] = [20, 20, 20]
    badge[size - 110:size - 30, size - 110:size - 30] = matrix_box
    cv2.rectangle(badge, (size - 110, size - 30), (size - 30, size - 110), (50, 50, 50), 1)
    
    # 4. Reactive Chemical Strip (Center)
    strip_color = ppm_to_strip_bgr(ppm, temp_c, rh)
    strip_w, strip_h = 160, 160
    sx = (size - strip_w) // 2
    sy = (size - strip_h) // 2
    
    # Add subtle chemical grain/texture to the strip
    strip_patch = np.zeros((strip_h, strip_w, 3), dtype=np.float32)
    for c in range(3):
        strip_patch[:, :, c] = strip_color[c] + np.random.normal(0, 3.5, (strip_h, strip_w))
    strip_patch = np.clip(strip_patch, 0, 255).astype(np.uint8)
    
    badge[sy:sy + strip_h, sx:sx + strip_w] = strip_patch
    cv2.rectangle(badge, (sx - 2, sy - 2), (sx + strip_w + 2, sy + strip_h + 2), (100, 100, 100), 2)
    
    # Text branding
    cv2.putText(badge, "SULFSCAN DOSIMETER", (30, size - 40), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (50, 50, 50), 1)
    cv2.putText(badge, "DGMS REG 124", (30, size - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (100, 100, 100), 1)
    
    # Lighting cast
    b_cast = random.uniform(0.92, 1.05)
    g_cast = random.uniform(0.95, 1.02)
    r_cast = random.uniform(0.95, 1.08)
    badge = np.clip(badge.astype(np.float32) * [b_cast, g_cast, r_cast], 0, 255).astype(np.uint8)
    
    # Noise
    noise = np.random.normal(0, random.uniform(1.0, 3.0), badge.shape).astype(np.float32)
    badge = np.clip(badge.astype(np.float32) + noise, 0, 255).astype(np.uint8)
    
    # Slight rotation
    angle = random.uniform(-6, 6)
    M = cv2.getRotationMatrix2D((size / 2, size / 2), angle, 1.0)
    badge = cv2.warpAffine(badge, M, (size, size), borderMode=cv2.BORDER_REPLICATE)
    
    return badge


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic colorimetric dosimeter dataset")
    parser.add_argument("--num-images", type=int, default=1000, help="Total images to generate")
    parser.add_argument("--output-dir", type=str, default="ml_calibration/dataset", help="Destination folder")
    args = parser.parse_args()
    
    img_dir = os.path.join(args.output_dir, "images")
    os.makedirs(img_dir, exist_ok=True)
    csv_path = os.path.join(args.output_dir, "metadata.csv")
    
    print(f"Generating {args.num_images} dosimeter badge images into {img_dir}...")
    
    records = []
    for i in range(args.num_images):
        p = random.random()
        if p < 0.4:
            ppm = round(random.uniform(0.1, 4.9), 2)
        elif p < 0.7:
            ppm = round(random.uniform(5.0, 9.9), 2)
        else:
            ppm = round(random.uniform(10.0, 48.0), 2)
            
        temp_c = round(random.uniform(18.0, 42.0), 1)
        rh = round(random.uniform(25.0, 85.0), 1)
        hours = 8.0
        
        delta_e = round(3.8 * math.sqrt(ppm * hours) * (1.0 + 0.012 * (temp_c - 25.0)) * (1.0 + 0.008 * (rh - 50.0)), 2)
        delta_e = max(0.0, delta_e)
        
        if ppm < 5.0:
            status = "NORMAL"
        elif ppm <= 10.0:
            status = "ACTION_REQUIRED"
        elif ppm <= 15.0:
            status = "DANGER_EXCEEDED"
        else:
            status = "STEL_EXCEEDED"
            
        fname = f"badge_{i+1:04d}.png"
        fpath = os.path.join(img_dir, fname)
        
        badge_img = generate_badge_image(ppm, temp_c, rh)
        cv2.imwrite(fpath, badge_img)
        
        records.append({
            "image_id": f"BDG-{i+1:04d}",
            "filename": fname,
            "h2s_ppm": ppm,
            "delta_e": delta_e,
            "temperature_c": temp_c,
            "relative_humidity": rh,
            "exposure_hours": hours,
            "compliance_status": status
        })
        
        if (i + 1) % 100 == 0 or (i + 1) == args.num_images:
            print(f"Progress: {i+1}/{args.num_images} images generated.")
            
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        fieldnames = ["image_id", "filename", "h2s_ppm", "delta_e", "temperature_c", "relative_humidity", "exposure_hours", "compliance_status"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)
        
    print(f"Dataset generation complete! Metadata saved to: {csv_path}")


if __name__ == "__main__":
    main()
