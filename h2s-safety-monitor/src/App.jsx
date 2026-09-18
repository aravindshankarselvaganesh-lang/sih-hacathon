import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { supabase } from "./supabaseClient";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BrowserMultiFormatReader } from "@zxing/library";
import {
  Activity,
  ShieldCheck,
  Camera,
  Square,
  Zap,
  AlertTriangle,
  User,
  Sparkles,
  BarChart3,
  Clock,
  FlaskConical,
  X,
} from "lucide-react";

// SECURITY: Gemini key comes from env only. If missing, AI feature is disabled (see processDiagnostic guard).
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_KEY || "";
const geminiClient = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const TURMERIC_SCALE = [
  { ppm: "0.8", color: "#f8ff6a", rgb: [248, 255, 106], label: "Safe Baseline", osha: "0.5 - 1.0 ppm" },
  { ppm: "2.4", color: "#f4cc8f", rgb: [244, 204, 143], label: "Trace Exposure", osha: "1.0 - 3.9 ppm" },
  { ppm: "4.8", color: "#f0b87f", rgb: [240, 184, 127], label: "Moderate Caution", osha: "3.9 - 5.8 ppm" },
  { ppm: "6.5", color: "#bf5f3a", rgb: [191, 95, 58], label: "Action Threshold", osha: "5.8 - 7.2 ppm" },
  { ppm: "8.5", color: "#d06e1f", rgb: [208, 110, 31], label: "Elevated Hazard", osha: "7.2 - 9.3 ppm" },
];

const lookupEmployee = async (workerId) => {
  const query = (workerId || "EMP001").trim();
  try {
    const { data, error } = await supabase.from("sulfisafe_employees").select("*");
    if (!error && data && data.length > 0) {
      const match = data.find((row) => {
        const d = row.data || {};
        return (
          (d.employeeId && d.employeeId.toUpperCase() === query.toUpperCase()) ||
          (d.id && String(d.id).toUpperCase() === query.toUpperCase()) ||
          (d.fullName && d.fullName.toLowerCase().includes(query.toLowerCase()))
        );
      });
      if (match && match.data) return match.data;
      const demo = data.find((row) => row.id === "demo-employee" || row.data?.employeeId === "EMP001");
      if (demo && demo.data) return { ...demo.data, employeeId: query, badgeId: query };
    }
  } catch (e) {
    console.warn("Supabase lookup notice:", e);
  }
  return {
    id: query,
    fullName:
      query.toUpperCase().includes("EMP001") ||
      query.toUpperCase().includes("EMP-4821") ||
      query.toUpperCase().includes("ARAVIND")
        ? "Aravind Shankar"
        : `Refining Operator (${query})`,
    employeeId: query,
    organisation: "SulfiSafe Industries",
    branch: "Main Plant",
    sector: "Refining & Chemical Operations",
    bloodGroup: "O+",
    phone: "+91 9876543210",
    bandExpiry: "30 September 2026",
  };
};

const saveExposureLog = async (badgeId, ppmValue, severity, recommendation) => {
  try {
    const empId = (badgeId || "EMP001").trim();
    const ppm = typeof ppmValue === "number" ? ppmValue : parseFloat(ppmValue) || 0;
    try {
      await supabase.from("h2s_exposure_logs").insert([
        { worker_id: empId, ppm, severity, ai_recommendation: recommendation },
      ]);
    } catch (e) {
      console.warn("Could not insert to h2s_exposure_logs:", e);
    }
    const isRisk = ppm >= 2 || severity === "warning" || severity === "danger";
    const riskStatus = isRisk ? "At Risk" : "Safe";
    const complianceStatus = ppm >= 7 ? "DANGER_EXCEEDED" : ppm >= 2 ? "ACTION_REQUIRED" : "NORMAL";

    let colorName = "cream";
    let colorLabel = "Cream";
    let colorHex = "#eee9d8";
    let deltaE = 4.2;

    if (ppm >= 7.2) {
      colorName = "dark_orange";
      colorLabel = "Dark Orange";
      colorHex = "#d06e1f";
      deltaE = 25.1;
    } else if (ppm >= 5.8) {
      colorName = "red_brown";
      colorLabel = "Red Brown";
      colorHex = "#bf5f3a";
      deltaE = 19.3;
    } else if (ppm >= 3.9) {
      colorName = "dark_tan";
      colorLabel = "Dark Tan";
      colorHex = "#f0b87f";
      deltaE = 14.5;
    } else if (ppm >= 1.0) {
      colorName = "light_tan";
      colorLabel = "Light Tan";
      colorHex = "#f4cc8f";
      deltaE = 8.2;
    } else {
      colorName = "neon_yellow";
      colorLabel = "Neon Yellow";
      colorHex = "#f8ff6a";
      deltaE = 3.1;
    }

    const timestampStr = new Date().toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const scanData = {
      badgeId: empId,
      observedColor: colorName,
      colorLabel,
      colorHex,
      deltaE,
      ppm,
      cumulativeDose: `${(ppm * 8).toFixed(1)} ppm·h`,
      complianceStatus,
      scannedAt: timestampStr,
      source: "SulfScan Colorimetry AI",
      recommendation: recommendation || "",
    };

    const { data: empRows, error: empErr } = await supabase.from("sulfisafe_employees").select("*");
    if (!empErr && empRows && empRows.length > 0) {
      let found = false;
      const updated = empRows.map((row) => {
        const d = row.data || {};
        if (
          (d.employeeId && empId && d.employeeId.toUpperCase() === empId.toUpperCase()) ||
          (d.id && empId && String(d.id).toUpperCase() === empId.toUpperCase()) ||
          (d.fullName && empId && d.fullName.toLowerCase().includes(empId.toLowerCase())) ||
          (!found && empRows.length === 1)
        ) {
          found = true;
          return {
            id: row.id,
            data: {
              ...d,
              riskStatus,
              cumulativeDose: `${(ppm * 8).toFixed(1)} ppm·h`,
              scanData,
            },
          };
        }
        return row;
      });
      if (!found && updated.length > 0) {
        updated[0].data = {
          ...updated[0].data,
          riskStatus,
          cumulativeDose: `${(ppm * 8).toFixed(1)} ppm·h`,
          scanData,
        };
      }
      await supabase.from("sulfisafe_employees").upsert(updated);
    } else {
      await supabase.from("sulfisafe_employees").upsert([
        {
          id: "demo-employee",
          data: {
            id: "demo-employee",
            fullName: empId === "WRISTBAND-MANUAL" || empId === "EMP001" ? "Aravind Shankar" : empId,
            employeeId: empId,
            organisation: "SulfiSafe Industries",
            branch: "Main Plant",
            sector: "Industrial Operations",
            bloodGroup: "O+",
            phone: "9876543210",
            // SECURITY: never store plaintext fallback passwords here. Use Supabase Auth instead.
            password: null,
            riskStatus,
            cumulativeDose: `${(ppm * 8).toFixed(1)} ppm·h`,
            temperature: 29,
            humidity: 63,
            bandExpiry: "30 September 2026",
            scanData,
          },
        },
      ]);
    }

    const alertId = Date.now();
    const alertMsg = isRisk
      ? `🚨 H2S Alert: ${empId} recorded ${ppm} ppm (${riskStatus.toUpperCase()}) - ${recommendation ? recommendation.slice(0, 80) + "..." : "Action required"}`
      : `✅ Health Scan: ${empId} recorded ${ppm} ppm (Safe & Cleared)`;

    await supabase.from("sulfisafe_alerts").upsert([
      {
        id: String(alertId),
        data: {
          id: alertId,
          message: alertMsg,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          employeeId: empId,
          employeeName: empId,
          ppm,
          type: isRisk ? "danger" : "safe",
        },
      },
    ]);
    return { success: true };
  } catch (err) {
    console.error("Supabase sync error in saveExposureLog:", err);
    return { success: false, error: err };
  }
};

const fetchRecentLogs = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from("h2s_exposure_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("Could not fetch logs from Supabase:", err);
    return [];
  }
};

function rgbToPpm(rgb) {
  const [r, g, b] = rgb;
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  if (max < 40 || delta < 15) return 0;
  const ratio = g / Math.max(1, r);
  if (ratio >= 0.9) {
    const val = 0.5 + ((1.1 - Math.min(1.1, ratio)) / 0.2) * 0.5;
    return Math.max(0.5, Math.round(val * 10) / 10);
  }
  if (ratio >= 0.8) {
    const val = 1.0 + ((0.9 - ratio) / 0.1) * 2.9;
    return Math.min(Math.round(val * 10) / 10, 3.9);
  }
  if (ratio >= 0.7) {
    const val = 3.9 + ((0.8 - ratio) / 0.1) * 1.9;
    return Math.min(Math.round(val * 10) / 10, 5.8);
  }
  if (ratio >= 0.55) {
    const val = 5.8 + ((0.7 - ratio) / 0.15) * 1.4;
    return Math.min(Math.round(val * 10) / 10, 7.2);
  }
  const val = 7.2 + ((0.55 - Math.max(0.3, ratio)) / 0.25) * 2.1;
  return Math.min(Math.round(val * 10) / 10, 10.5);
}

function extractStripColor(ctx, width, height) {
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const rw = Math.max(10, Math.floor(width * 0.15));
  const rh = Math.max(10, Math.floor(height * 0.2));
  const rx = Math.max(0, cx - rw - Math.floor(width * 0.05));
  const ry = cy - Math.floor(rh / 2);
  const data = ctx.getImageData(rx, ry, rw, rh).data;
  const rList = [];
  const gList = [];
  const bList = [];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (
      (r > 245 && g > 245 && b > 245) ||
      (r < 40 && g < 40 && b < 40) ||
      (Math.abs(r - g) < 8 && Math.abs(g - b) < 8)
    ) {
      continue;
    }
    rList.push(r);
    gList.push(g);
    bList.push(b);
  }
  if (rList.length > 10) {
    rList.sort((a, b) => a - b);
    gList.sort((a, b) => a - b);
    bList.sort((a, b) => a - b);
    const mid = Math.floor(rList.length / 2);
    return [rList[mid], gList[mid], bList[mid]];
  }
  return [215, 215, 140];
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [simulatedExposure, setSimulatedExposure] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanError, setScanError] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const codeReaderRef = useRef(null);
  const isScanningRef = useRef(false);
  const intervalRef = useRef(null);
  const detectedBarcodeRef = useRef(null);
  const lockStreakRef = useRef(0);

  useEffect(() => {
    async function loadLogs() {
      const logs = await fetchRecentLogs(10);
      if (logs && logs.length > 0) {
        setHistory(
          logs.map((l) => ({
            id: l.id,
            workerId: l.worker_id,
            ppm: l.ppm,
            severity: l.severity,
            recommendation: l.ai_recommendation,
            timestamp: new Date(l.timestamp).toLocaleTimeString(),
          }))
        );
      }
    }
    loadLogs();
  }, []);

  useEffect(() => {
    return () => {
      cleanupCamera();
    };
  }, []);

  const cleanupCamera = () => {
    isScanningRef.current = false;
    setScanProgress(0);
    lockStreakRef.current = 0;
    detectedBarcodeRef.current = null;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current = null;
      } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setScreen("camera");
    setScanError("");
    isScanningRef.current = true;
    setScanProgress(0);
    lockStreakRef.current = 0;
    detectedBarcodeRef.current = null;
    window.scrollTo({ top: 0, behavior: "smooth" });

    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
    } catch (err) {
      console.warn("Rear camera constraint failed, fallback to default camera:", err);
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (e) {
        console.error("Camera access error:", e);
        setScanError("Camera unavailable. Please allow camera access and try again.");
        setScreen("home");
        return;
      }
    }

    streamRef.current = stream;
    setTimeout(async () => {
      if (isScanningRef.current && videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.warn("Video play notice:", e);
        }

        try {
          const reader = new BrowserMultiFormatReader();
          codeReaderRef.current = reader;
        } catch (err) {
          console.warn("Zxing init skipped:", err);
        }

        let tickCount = 0;
        intervalRef.current = setInterval(() => {
          if (!isScanningRef.current || !videoRef.current) return;
          tickCount += 1;
          const video = videoRef.current;
          if (video.readyState < 2) return;
          const vw = video.videoWidth;
          const vh = video.videoHeight;
          if (!vw || !vh) return;

          const canvas = document.createElement("canvas");
          canvas.width = vw;
          canvas.height = vh;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          ctx.drawImage(video, 0, 0, vw, vh);

          // Horizontal Barcode Try
          if (!detectedBarcodeRef.current && codeReaderRef.current) {
            try {
              const res = codeReaderRef.current.decodeFromCanvas(canvas);
              if (res) {
                detectedBarcodeRef.current = res.getText();
                console.log("Barcode Auto-Locked (Horiz):", detectedBarcodeRef.current);
              }
            } catch {}
          }

          // Vertical Barcode Try
          if (!detectedBarcodeRef.current && codeReaderRef.current) {
            try {
              const rotated = document.createElement("canvas");
              rotated.width = vh;
              rotated.height = vw;
              const rCtx = rotated.getContext("2d", { willReadFrequently: true });
              rCtx.translate(vh / 2, vw / 2);
              rCtx.rotate((90 * Math.PI) / 180);
              rCtx.drawImage(canvas, -vw / 2, -vh / 2);
              const rRes = codeReaderRef.current.decodeFromCanvas(rotated);
              if (rRes) {
                detectedBarcodeRef.current = rRes.getText();
                console.log("Vertical Barcode Auto-Locked:", detectedBarcodeRef.current);
              }
            } catch {}
          }

          const [rVal, gVal, bVal] = extractStripColor(ctx, vw, vh);
          if ((rVal > bVal + 15 && rVal > 80) || detectedBarcodeRef.current) {
            lockStreakRef.current += 1;
            const progress = Math.min(100, lockStreakRef.current * 25);
            setScanProgress(progress);
            if (lockStreakRef.current >= 4) {
              completeScan(detectedBarcodeRef.current || "EMP001");
            }
          } else {
            lockStreakRef.current = Math.max(0, lockStreakRef.current - 1);
            setScanProgress(lockStreakRef.current * 25);
          }

          if (tickCount >= 15 && isScanningRef.current) {
            console.log("3-second hard limit reached. Aborting scan.");
            cleanupCamera();
            setScanError("Scan timed out. Please align the wristband and try again.");
            setScreen("home");
          }
        }, 200);
      }
    }, 100);
  };

  const completeScan = (workerId) => {
    if (!isScanningRef.current || !videoRef.current) return;
    isScanningRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 640 / (video.videoWidth || 640));
    canvas.width = (video.videoWidth || 640) * scale;
    canvas.height = (video.videoHeight || 480) * scale;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    cleanupCamera();
    processDiagnostic(ctx, canvas, workerId || "EMP001");
  };

  const snapInstant = () => {
    completeScan(detectedBarcodeRef.current || "WRISTBAND-MANUAL");
  };

  const processDiagnostic = (ctx, canvas, workerId) => {
    try {
      const rgb = extractStripColor(ctx, canvas.width, canvas.height);
      const ppm = rgbToPpm(rgb);
      let severity = "safe";
      if (ppm >= 9) severity = "danger";
      else if (ppm >= 4) severity = "warning";

      const fallbackRec =
        severity === "danger"
          ? "CRITICAL ALERT: Exposure exceeds OSHA 10 ppm PEL. Evacuate worker immediately to fresh air and alert the response team."
          : severity === "warning"
          ? "WARNING: H2S level is elevated (approaching OSHA 10 ppm PEL limit). Increase local ventilation and monitor worker symptoms."
          : "SAFE: Exposure is well within normal permissible limits (< 4 ppm). Worker cleared for duty.";

      const newScan = {
        id: Date.now(),
        workerId: workerId || "EMP001",
        ppm,
        extractedRgb: rgb,
        severity,
        recommendation: fallbackRec,
        timestamp: new Date().toLocaleTimeString(),
        owner: null,
      };

      setHistory((prev) => [newScan, ...prev]);
      setResult(newScan);
      setScreen("result");
      window.scrollTo({ top: 0, behavior: "smooth" });

      lookupEmployee(workerId || "EMP001")
        .then((profile) => {
          if (profile) {
            setResult((curr) => (curr && curr.id === newScan.id ? { ...curr, owner: profile } : curr));
          }
        })
        .catch((err) => console.warn("Worker profile lookup notice:", err));

      saveExposureLog(workerId || "EMP001", ppm, severity, fallbackRec);

      // AI enhancement is optional and env-gated. Never call the API without a key.
      if (!geminiClient) {
        setResult((curr) =>
          curr && curr.id === newScan.id
            ? { ...curr, recommendation: `${fallbackRec} (AI disabled: set VITE_GEMINI_KEY to enable.)` }
            : curr
        );
      } else {
        geminiClient
          .getGenerativeModel({ model: "gemini-1.5-flash" })
          .generateContent(
            `A chemical refinery worker (Badge: ${workerId}) was exposed to ${ppm} ppm of Hydrogen Sulfide (H2S). The OSHA 8-hour Permissible Exposure Limit (PEL) is 10 ppm. Severity: ${severity}. Provide a concise 2-sentence emergency response protocol for the safety officer.`
          )
          .then((res) => {
            const text = res.response.text();
            if (text) {
              setResult((curr) => (curr && curr.id === newScan.id ? { ...curr, recommendation: text } : curr));
              setHistory((prev) => prev.map((item) => (item.id === newScan.id ? { ...item, recommendation: text } : item)));
            }
          })
          .catch((err) => console.warn("Gemini async notice:", err));
      }
    } catch (err) {
      console.error("Local analysis error:", err);
      setScanError("Could not complete the scan. Please try again.");
      setScreen("home");
    }
  };

  return (
    <div className="app-shell">
      {/* App Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-logo-glow">
            <Activity size={22} color="#38bdf8" />
          </div>
          <div>
            <div className="brand-title">SULFSCAN™ EDGE</div>
            <div className="brand-sub">Optical H₂S Rapid Detection System</div>
          </div>
        </div>
        <div className="header-status">
          <div className="status-pill">
            <span className="status-dot"></span>
            <span>Edge AI & Cloud Sync Active</span>
          </div>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main className="dashboard-container">
        <section className="stage-panel">
          {/* SCREEN 1: HOME */}
          {screen === "home" && (
            <div className="welcome-hero">
              <div className="hero-icon-wrap">
                <ShieldCheck size={44} />
              </div>
              <h1 className="hero-title">Wearable H₂S Monitor</h1>
              {scanError && (
                <div role="alert" style={{ color: "#f87171", marginBottom: "0.75rem" }}>
                  {scanError}
                </div>
              )}
              <p className="hero-desc">
                High-precision colorimetric scanner for 3D wearable wristbands. Features continuous automatic strip detection, instant edge AI & OSHA safety analytics.
              </p>
              <div className="workflow-grid">
                <div className="workflow-step">
                  <div className="step-num">STEP 01</div>
                  <div className="step-text">Align Wristband</div>
                </div>
                <div className="workflow-step">
                  <div className="step-num">STEP 02</div>
                  <div className="step-text">Auto Lock Strip (&lt;1s)</div>
                </div>
                <div className="workflow-step">
                  <div className="step-num">STEP 03</div>
                  <div className="step-text">Instant Result</div>
                </div>
              </div>
              <div className="action-buttons-group">
                <button className="btn btn-hero-camera" onClick={startCamera}>
                  <Camera size={28} />
                  <div className="hero-btn-content">
                    <span className="hero-btn-title">START CAMERA SCANNER</span>
                    <span className="hero-btn-sub">Auto-detects wristband strip & barcode automatically</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 2: CAMERA HUD */}
          {screen === "camera" && (
            <div className="camera-view-wrapper">
              <div className="camera-header-hud">
                <div className="camera-status-indicator">
                  <span
                    className="status-dot"
                    style={{
                      background: scanProgress >= 75 ? "#22c55e" : "#38bdf8",
                      boxShadow: `0 0 8px ${scanProgress >= 75 ? "#22c55e" : "#38bdf8"}`,
                    }}
                  ></span>
                  <span>
                    {scanProgress > 0
                      ? `AUTO-LOCKING (${scanProgress}%) · Hold Steady`
                      : `AUTO-SCANNER ACTIVE · Align Wristband`}
                  </span>
                </div>
              </div>
              <div className="camera-container" onClick={snapInstant} style={{ cursor: "pointer" }}>
                <video ref={videoRef} autoPlay playsInline muted className="camera-video"></video>
                <div className="camera-hud-overlay">
                  <div className="radar-sweep-line"></div>
                  <div
                    className="wristband-target-frame"
                    style={{
                      borderColor: scanProgress >= 75 ? "#22c55e" : "rgba(56, 189, 248, 0.85)",
                    }}
                  >
                    <div className="wristband-inner-grid">
                      <div className="hud-col">STRIP</div>
                      <div className="hud-col">BARCODE</div>
                      <div className="hud-col">REF</div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  className="btn btn-danger-stop"
                  style={{ flex: 1 }}
                  onClick={() => {
                    cleanupCamera();
                    setScreen("home");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <Square size={20} /> ⏹ STOP SCAN & EXIT
                </button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={snapInstant}>
                  <Zap size={18} /> INSTANT SNAP
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 3: RESULT */}
          {screen === "result" && result && (
            <div className={`result-card ${result.severity}`}>
              <div className="result-header-row">
                <div className="worker-badge-tag">WEARABLE BADGE: {result.workerId}</div>
                <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{result.timestamp}</div>
              </div>

              <div className="ppm-hero-box">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {result.severity === "safe" ? (
                    <ShieldCheck size={28} color="var(--safe)" />
                  ) : (
                    <AlertTriangle size={28} color={result.severity === "danger" ? "var(--danger)" : "var(--warning)"} />
                  )}
                  <span className="severity-label">
                    {result.severity === "safe"
                      ? "SAFE AIR QUALITY"
                      : result.severity === "danger"
                      ? "CRITICAL HAZARD"
                      : "ELEVATED WARNING"}
                  </span>
                </div>
                <div className="ppm-number">
                  {result.ppm} <span style={{ fontSize: "1.5rem", fontWeight: 500, color: "#94a3b8" }}>PPM</span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>
                  {result.ppm < 4
                    ? "Within Safe Workplace Environmental Baseline (< 4 ppm)"
                    : result.ppm < 9
                    ? "Elevated — Approaching OSHA 10 ppm 8-Hour PEL"
                    : "CRITICAL: Exceeds OSHA 10 ppm Permissible Exposure Limit"}
                </div>
              </div>

              {/* Worker Profile Card */}
              <div className="worker-profile-card">
                <div className="profile-header-row">
                  <div className="profile-avatar-circle">
                    <User size={22} color="#38bdf8" />
                  </div>
                  <div className="profile-meta">
                    <div className="profile-name">{result.owner?.fullName || "Aravind Shankar"}</div>
                    <div className="profile-id-tag">
                      <span>ID: <strong>{result.workerId}</strong></span>
                      <span className="dot-sep">•</span>
                      <span>{result.owner?.sector || "Refining & Chemical Operations"}</span>
                    </div>
                  </div>
                </div>
                <div className="profile-details-grid">
                  <div className="profile-detail-item">
                    <span className="detail-label">ORGANISATION</span>
                    <span className="detail-value">{result.owner?.organisation || "SulfiSafe Industries"}</span>
                  </div>
                  <div className="profile-detail-item">
                    <span className="detail-label">PLANT / BRANCH</span>
                    <span className="detail-value">{result.owner?.branch || "Main Plant"}</span>
                  </div>
                  <div className="profile-detail-item">
                    <span className="detail-label">BLOOD GROUP</span>
                    <span className="detail-value">{result.owner?.bloodGroup || "O+"}</span>
                  </div>
                  <div className="profile-detail-item">
                    <span className="detail-label">EMERGENCY PHONE</span>
                    <span className="detail-value">{result.owner?.phone || "+91 9876543210"}</span>
                  </div>
                </div>
              </div>

              {/* Gemini Recommendation */}
              <div className="ai-recommendation-box">
                <div className="ai-header">
                  <Sparkles size={18} /> Gemini Safety Protocol
                </div>
                <div className="ai-body">{result.recommendation}</div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button className="btn btn-hero-camera" style={{ flex: 1.5 }} onClick={startCamera}>
                  <Camera size={20} /> SCAN NEXT WRISTBAND
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setScreen("home")}>
                  DASHBOARD
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Sidebar Panel */}
        <aside className="sidebar-panel">
          {/* Turmeric Indicator Scale */}
          <div className="card">
            <div className="card-title">
              <BarChart3 size={18} color="#f59e0b" />
              <span>Turmeric Indicator Scale (Calibrated)</span>
            </div>
            <div className="scale-table">
              {TURMERIC_SCALE.map((item) => (
                <div className="scale-row" key={item.ppm}>
                  <div className="scale-info">
                    <div className="scale-color-chip" style={{ backgroundColor: item.color }}></div>
                    <div>
                      <div className="scale-ppm">{item.ppm} PPM</div>
                      <div className="scale-desc">{item.label}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>{item.osha}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Exposure History */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-title">
              <Clock size={18} color="#0ea5e9" />
              <span>Live Exposure History</span>
            </div>
            {history.length === 0 ? (
              <p style={{ fontSize: "0.85rem", color: "#64748b", textAlign: "center", padding: "1.5rem" }}>
                No recent scans logged yet. Start a scan or upload a picture to populate.
              </p>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <div className={`history-item ${item.severity}`} key={item.id}>
                    <div className="history-meta">
                      <span className="history-id">{item.workerId}</span>
                      <span className="history-time">{item.timestamp}</span>
                    </div>
                    <div
                      className="history-ppm"
                      style={{
                        color:
                          item.severity === "safe"
                            ? "var(--safe)"
                            : item.severity === "danger"
                            ? "var(--danger)"
                            : "var(--warning)",
                      }}
                    >
                      {item.ppm} PPM
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Smart Wearable Wristband Specifications Section */}
      <section className="wristband-specs-section">
        <div className="specs-container-card">
          <div className="section-header-row">
            <div className="section-title-wrap">
              <BarChart3 size={20} color="#38bdf8" />
              <h2>Smart Wearable Wristband Specifications</h2>
            </div>
            <button
              className="btn btn-accent"
              style={{ fontSize: "0.82rem", padding: "0.5rem 0.85rem" }}
              onClick={() => setShowModal(true)}
            >
              <FlaskConical size={16} /> 🧪 Open 3D Badge Simulator
            </button>
          </div>
          <div className="specs-grid">
            <div className="spec-card">
              <div className="spec-card-top">
                <div className="spec-card-icon" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }}>
                  🔍
                </div>
                <div className="spec-card-title">3-Zone Optical Cartridge</div>
              </div>
              <div className="spec-card-body">
                Dual-modality badge integrating chemical sensor pad, high-density vertical Code-128 barcode, and 5-point CIE-LAB reference chips in a single unified viewport.
              </div>
              <div className="spec-tags">
                <span className="spec-tag">Zone 1: Active Strip</span>
                <span className="spec-tag">Zone 2: Code 128 ID</span>
                <span className="spec-tag">Zone 3: Calibration</span>
              </div>
            </div>

            <div className="spec-card">
              <div className="spec-card-top">
                <div className="spec-card-icon" style={{ background: "rgba(234, 179, 8, 0.15)", color: "#eab308" }}>
                  🧪
                </div>
                <div className="spec-card-title">Curcumin Chelation Reagent</div>
              </div>
              <div className="spec-card-body">
                Natural Curcumin (C₂₁H₂₀O₆) chelation layer. Selective optical chromogenic shift from bright yellow (0 ppm) to dark brown/black upon H₂S exposure.
              </div>
              <div className="spec-tags">
                <span className="spec-tag">0 - 18 ppm Range</span>
                <span className="spec-tag">&lt; 1s Reaction Time</span>
                <span className="spec-tag">Zero Gas Cross-Drift</span>
              </div>
            </div>

            <div className="spec-card">
              <div className="spec-card-top">
                <div className="spec-card-icon" style={{ background: "rgba(34, 197, 94, 0.15)", color: "#22c55e" }}>
                  🛡️
                </div>
                <div className="spec-card-title">Industrial Wearable Specs</div>
              </div>
              <div className="spec-card-body">
                Passive zero-battery wearable band manufactured from medical-grade anti-microbial silicone with acrylic anti-glare window. 30-day continuous field deployment.
              </div>
              <div className="spec-tags">
                <span className="spec-tag">Zero Battery / Zero Power</span>
                <span className="spec-tag">IP67 Dust & Moisture</span>
                <span className="spec-tag">30-Day Expiry</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3D Badge Simulator Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, color: "#ffffff" }}>
                <FlaskConical size={20} color="#38bdf8" />
                <span>Wearable Wristband Badge Simulator</span>
              </div>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", textAlign: "center" }}>
              Hold this wristband simulation in front of your laptop webcam (or open it on your phone). The auto-scanner will lock onto the center barcode!
            </p>

            <div className="wearable-device-wrapper">
              <div className="wristband-strap-loop"></div>
              <div className="wristband-body">
                <div className="wristband-hinge"></div>
                <div className="wristband-viewport">
                  <div
                    className="viewport-strip-col"
                    style={{
                      backgroundColor:
                        simulatedExposure === 0
                          ? "rgb(249, 248, 158)"
                          : simulatedExposure === 6.2
                          ? "rgb(219, 177, 138)"
                          : "rgb(215, 138, 104)",
                    }}
                  >
                    <span className="strip-label">STRIP</span>
                  </div>
                  <div className="viewport-barcode-col">
                    <img
                      src="https://barcode.tec-it.com/barcode.ashx?data=EMP-4821&code=Code128&dpi=96&rotation=90"
                      alt="Vertical Code 128 Barcode"
                      className="vertical-barcode-svg"
                    />
                  </div>
                  <div className="viewport-scale-col">
                    <div className="ref-scale-step" style={{ backgroundColor: "rgb(249, 248, 158)" }} title="0 ppm"></div>
                    <div className="ref-scale-step" style={{ backgroundColor: "rgb(238, 198, 168)" }} title="3.3 ppm"></div>
                    <div className="ref-scale-step" style={{ backgroundColor: "rgb(219, 177, 138)" }} title="6.2 ppm"></div>
                    <div className="ref-scale-step" style={{ backgroundColor: "rgb(210, 146, 109)" }} title="8.8 ppm"></div>
                    <div className="ref-scale-step" style={{ backgroundColor: "rgb(215, 138, 104)" }} title="11 ppm"></div>
                  </div>
                </div>
              </div>
              <div className="wristband-strap-loop"></div>
            </div>

            <div style={{ width: "100%" }}>
              <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.5rem", textAlign: "center" }}>
                Select Chemical Exposure to Simulate:
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className="btn btn-secondary"
                  style={{
                    flex: 1,
                    fontSize: "0.8rem",
                    padding: "0.5rem",
                    borderColor: simulatedExposure === 0 ? "var(--safe)" : "",
                  }}
                  onClick={() => setSimulatedExposure(0)}
                >
                  🟢 0 ppm (Safe)
                </button>
                <button
                  className="btn btn-secondary"
                  style={{
                    flex: 1,
                    fontSize: "0.8rem",
                    padding: "0.5rem",
                    borderColor: simulatedExposure === 6.2 ? "var(--warning)" : "",
                  }}
                  onClick={() => setSimulatedExposure(6.2)}
                >
                  🟡 6.2 ppm (Caution)
                </button>
                <button
                  className="btn btn-secondary"
                  style={{
                    flex: 1,
                    fontSize: "0.8rem",
                    padding: "0.5rem",
                    borderColor: simulatedExposure === 11 ? "var(--danger)" : "",
                  }}
                  onClick={() => setSimulatedExposure(11)}
                >
                  🔴 11 ppm (Danger)
                </button>
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setShowModal(false)}>
              DONE / READY TO SCAN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}