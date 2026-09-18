"""
Automatic Badge Image Preprocessor & Label Generator
----------------------------------------------------
Scans any folder of real dosimeter badge images (e.g. ml_calibration/user_dataset/images),
extracts colorimetry metrics, and generates a ready-to-train metadata.csv file.
"""

import os
import csv
import cv2
import math
import argparse
import numpy as np


VIRGIN_LAB = np.array([92.8, -1.2, 5.4], dtype=np.float32)


def process_image(image_path: str):
    img = cv2.imread(image_path)
    if img is None:
        return None
        
    h, w, _ = img.shape
    
    # 1. White patch sampling
    wx1, wy1 = int(w * 0.06), int(h * 0.06)
    wx2, wy2 = int(w * 0.20), int(h * 0.20)
    white_roi = img[wy1:wy2, wx1:wx2]
    white_bgr = np.mean(white_roi, axis=(0, 1)) if white_roi.size > 0 else np.array([250.0, 250.0, 250.0])
    
    wb_scale = 250.0 / np.maximum(white_bgr, 30.0)
    wb_scale = np.clip(wb_scale, 0.6, 1.6)
    
    # 2. Reactive strip sampling
    sx1, sy1 = int(w * 0.35), int(h * 0.35)
    sx2, sy2 = int(w * 0.65), int(h * 0.65)
    strip_roi = img[sy1:sy2, sx1:sx2]
    
    norm_strip = np.clip(strip_roi.astype(np.float32) * wb_scale, 0, 255).astype(np.uint8)
    mean_bgr = np.mean(norm_strip, axis=(0, 1))
    
    # LAB convert
    pixel_bgr = np.uint8([[mean_bgr]])
    pixel_lab = cv2.cvtColor(pixel_bgr, cv2.COLOR_BGR2LAB)[0][0].astype(np.float32)
    lab_scaled = np.array([
        pixel_lab[0] * (100.0 / 255.0),
        pixel_lab[1] - 128.0,
        pixel_lab[2] - 128.0
    ])
    
    delta_e = float(np.linalg.norm(lab_scaled - VIRGIN_LAB))
    
    # Estimate ppm using inverse Arrhenius kinetics at baseline 25C, 50% RH
    # delta_E = 3.8 * sqrt(ppm * 8) => ppm = (delta_E / 3.8)^2 / 8
    norm_e = delta_e / 3.8
    est_ppm = round(float((norm_e ** 2) / 8.0), 2)
    est_ppm = min(50.0, max(0.0, est_ppm))
    
    if est_ppm < 5.0:
        status = "NORMAL"
    elif est_ppm <= 10.0:
        status = "ACTION_REQUIRED"
    elif est_ppm <= 15.0:
        status = "DANGER_EXCEEDED"
    else:
        status = "STEL_EXCEEDED"
        
    return {
        "delta_e": round(delta_e, 2),
        "est_ppm": est_ppm,
        "status": status
    }


def main():
    parser = argparse.ArgumentParser(description="Auto-label user images for AI training")
    parser.add_argument("--img-dir", type=str, default="ml_calibration/user_dataset/images")
    parser.add_argument("--output-csv", type=str, default="ml_calibration/user_dataset/metadata.csv")
    parser.add_argument("--default-temp", type=float, default=28.0)
    parser.add_argument("--default-humidity", type=float, default=55.0)
    args = parser.parse_args()
    
    if not os.path.exists(args.img_dir):
        print(f"Directory {args.img_dir} does not exist.")
        return
        
    valid_exts = {".png", ".jpg", ".jpeg", ".bmp", ".webp"}
    files = [f for f in os.listdir(args.img_dir) if os.path.splitext(f.lower())[1] in valid_exts]
    
    if not files:
        print(f"No image files found in {args.img_dir}.")
        print("Please place your images (.jpg/.png) into that directory first.")
        return
        
    print(f"Found {len(files)} images. Auto-analyzing colorimetry and generating labels...")
    records = []
    
    for idx, fname in enumerate(sorted(files)):
        fpath = os.path.join(args.img_dir, fname)
        res = process_image(fpath)
        if res is None:
            continue
            
        records.append({
            "image_id": f"IMG-{idx+1:04d}",
            "filename": fname,
            "h2s_ppm": res["est_ppm"],
            "delta_e": res["delta_e"],
            "temperature_c": args.default_temp,
            "relative_humidity": args.default_humidity,
            "exposure_hours": 8.0,
            "compliance_status": res["status"]
        })
        
    with open(args.output_csv, "w", newline="", encoding="utf-8") as f:
        fieldnames = ["image_id", "filename", "h2s_ppm", "delta_e", "temperature_c", "relative_humidity", "exposure_hours", "compliance_status"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)
        
    print(f"Successfully processed {len(records)} images!")
    print(f"Auto-generated metadata CSV saved to: {args.output_csv}")
    print("You can now review/edit the CSV if needed, and run:")
    print("  python ml_calibration/train_model.py --train --data-dir ml_calibration/user_dataset")


if __name__ == "__main__":
    main()
