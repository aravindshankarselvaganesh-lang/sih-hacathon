import { useState, useEffect, useRef } from "react";
import "./App.css";
import { supabase } from "./supabaseClient";

function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [screen, setScreen] = useState("home");
  const [history, setHistory] = useState([]);
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [location, setLocation] = useState(
    "Fetching current location..."
  );
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const autoScanTimerRef = useRef(null);
  const barcodeScanIntervalRef = useRef(null);
  const detectedBarcodeRef = useRef(false);

  /* =================================
     SAMPLE BARCODE DATABASE
  ================================= */

  const wristbandDatabase = {
    BARCODE123: {
      name: "Rahul Sharma",
      workerId: "WRK-1024",
      workerUnit: "Production Unit A",
      status: "valid",
      entryExit: "ENTRY",
    },

    BARCODE456: {
      name: "Priya Singh",
      workerId: "WRK-2048",
      workerUnit: "Maintenance Unit",
      status: "expiring",
      entryExit: "EXIT",
    },

    BARCODE789: {
      name: "Aman Kumar",
      workerId: "WRK-3072",
      workerUnit: "Safety Department",
      status: "expired",
      entryExit: "ENTRY",
    },
  };

  /* =================================
     STATUS TEXT
  ================================= */

  const getStatusText = (status) => {
    if (status === "valid") return "VALID";
    if (status === "expiring") return "EXPIRING SOON";
    if (status === "expired") return "EXPIRED";

    return "UNKNOWN";
  };

  /* =================================
     DATE FORMAT
  ================================= */

  const getFormattedDate = () => {
    const now = new Date();

    const day = String(now.getDate()).padStart(2, "0");

    const month = String(
      now.getMonth() + 1
    ).padStart(2, "0");

    const year = now.getFullYear();

    return `${day}-${month}-${year}`;
  };

  /* =================================
     GET CURRENT LOCATION
  ================================= */

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocation(
        "Location is not supported by this browser."
      );

      return;
    }

    setLocation("Fetching current location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );

          const data = await response.json();

          if (data && data.display_name) {
            setLocation(data.display_name);
          } else {
            setLocation(
              "Exact location could not be identified."
            );
          }
        } catch (error) {
          console.error("Location error:", error);

          setLocation(
            "Unable to fetch exact location."
          );
        }
      },

      (error) => {
        console.error("Geolocation error:", error);

        if (
          error.code === error.PERMISSION_DENIED
        ) {
          setLocation(
            "Location permission was denied."
          );
        } else {
          setLocation(
            "Unable to detect current location."
          );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  /* =================================
     START CAMERA
  ================================= */

  const startCamera = async () => {
    try {
      setCameraError("");

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setCameraError(
          "Camera is not supported by this browser."
        );

        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "environment",
            },
          },

          audio: false,
        });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
        };
      }
    } catch (error) {
      console.error("Camera error:", error);

      setCameraError(
        "Unable to access camera. Please allow camera permission."
      );
    }
  };

  /* =================================
     STOP CAMERA
  ================================= */

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      streamRef.current = null;
    }
  };

  /* =================================
     STOP BARCODE DETECTION
  ================================= */

  const stopBarcodeDetection = () => {
    if (barcodeScanIntervalRef.current) {
      clearInterval(
        barcodeScanIntervalRef.current
      );

      barcodeScanIntervalRef.current = null;
    }
  };

  /* =================================
     CHECK DUPLICATE SCAN
  ================================= */

  const checkAlreadyScanned = (enteredBarcode) => {
    const now = Date.now();

    const previousScan = history.find(
      (record) =>
        record.barcode === enteredBarcode &&
        now - record.timestamp < 60000
    );

    return previousScan;
  };

  /* =================================
     CREATE SCAN DATA
  ================================= */

  const createScanData = (
    worker,
    enteredBarcode
  ) => {
    const now = new Date();

    return {
      ...worker,

      barcode: enteredBarcode,

      id: Date.now(),

      timestamp: Date.now(),

      date: getFormattedDate(),

      time: now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),

      location,
    };
  };

  /* =================================
     PROCESS BARCODE
  ================================= */

  const processBarcode = async (barcodeValue) => {
    const enteredBarcode = barcodeValue?.trim().toUpperCase();
    if (!enteredBarcode) return;

    const alreadyScanned = checkAlreadyScanned(enteredBarcode);
    if (alreadyScanned) {
      setIsScanning(false);
      setScanResult({
        success: false,
        alreadyScanned: true,
        name: alreadyScanned.name,
        barcode: alreadyScanned.barcode,
        workerId: alreadyScanned.workerId,
        message: "This worker has already been scanned within the last 1 minute.",
      });
      stopBarcodeDetection();
      stopCamera();
      setScreen("failed");
      return;
    }

    setIsScanning(true);

    try {
      const { data: workers, error } = await supabase
        .from('workers')
        .select('*')
        .eq('barcode', enteredBarcode)
        .limit(1);

      if (error || !workers || workers.length === 0) {
        setIsScanning(false);
        setScanResult({ success: false, message: "Barcode was not found in the system." });
        stopBarcodeDetection();
        stopCamera();
        setScreen("failed");
        return;
      }

      const worker = workers[0];
      const workerDetails = {
        name: worker.name,
        workerId: worker.worker_id,
        workerUnit: worker.worker_unit,
        status: worker.status,
        entryExit: worker.entry_exit
      };

      const scanData = createScanData(workerDetails, enteredBarcode);

      // Save to Supabase
      await supabase.from('scans').insert([{
        worker_id: worker.id,
        barcode: enteredBarcode,
        location: location,
        scan_type: worker.entry_exit,
        admin_id: session?.user?.id
      }]);

      setHistory((previousHistory) => [scanData, ...previousHistory]);
      setScanResult({ success: true, ...scanData });
      setIsScanning(false);
      stopBarcodeDetection();
      stopCamera();
      setScreen("result");
    } catch (err) {
      setIsScanning(false);
      setScanResult({ success: false, message: "Network error checking barcode." });
      stopBarcodeDetection();
      stopCamera();
      setScreen("failed");
    }
  };

  /* =================================
     BARCODE DETECTION
  ================================= */

  const startBarcodeDetection = () => {
    if (!("BarcodeDetector" in window)) {
      console.log(
        "BarcodeDetector is not supported. Demo scan will be used."
      );

      return;
    }

    try {
      const barcodeDetector =
        new window.BarcodeDetector({
          formats: [
            "code_128",
            "code_39",
            "ean_13",
            "ean_8",
            "upc_a",
            "upc_e",
            "qr_code",
          ],
        });

      barcodeScanIntervalRef.current =
        setInterval(async () => {
          if (
            detectedBarcodeRef.current ||
            !videoRef.current ||
            videoRef.current.readyState < 2
          ) {
            return;
          }

          try {
            const detectedBarcodes =
              await barcodeDetector.detect(
                videoRef.current
              );

            if (
              detectedBarcodes.length > 0
            ) {
              const barcodeValue =
                detectedBarcodes[0].rawValue;

              if (barcodeValue) {
                detectedBarcodeRef.current = true;

                stopBarcodeDetection();

                processBarcode(barcodeValue);
              }
            }
          } catch (error) {
            console.log(
              "Barcode detection error:",
              error
            );
          }
        }, 500);
    } catch (error) {
      console.error(
        "Barcode scanner error:",
        error
      );
    }
  };

  /* =================================
     AUTOMATIC DEMO SCAN
  ================================= */

  const automaticScan = () => {
    if (
      isScanning ||
      detectedBarcodeRef.current
    ) {
      return;
    }

    const demoBarcodes = [
      "BARCODE123",
      "BARCODE456",
      "BARCODE789",
    ];

    const randomBarcode =
      demoBarcodes[
        Math.floor(
          Math.random() *
            demoBarcodes.length
        )
      ];

    detectedBarcodeRef.current = true;

    processBarcode(randomBarcode);
  };

  /* =================================
     SCANNER EFFECT
  ================================= */

  useEffect(() => {
    if (screen === "scanner") {
      detectedBarcodeRef.current = false;

      startCamera();

      getCurrentLocation();

      const detectionTimer =
        setTimeout(() => {
          startBarcodeDetection();
        }, 1500);

      autoScanTimerRef.current =
        setTimeout(() => {
          if (
            !detectedBarcodeRef.current
          ) {
            automaticScan();
          }
        }, 5000);

      return () => {
        clearTimeout(detectionTimer);

        stopCamera();

        stopBarcodeDetection();

        if (
          autoScanTimerRef.current
        ) {
          clearTimeout(
            autoScanTimerRef.current
          );
        }
      };
    }

    return undefined;
  }, [screen]);

  /* =================================
     NAVIGATION
  ================================= */

  const startScanning = () => {
    setScreen("intro");
  };

  const openScanner = () => {
    setCameraError("");
    setIsScanning(false);
    setScreen("scanner");
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    else setSession(data.session);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  /* =================================
     AUTH SCREEN
  ================================= */
  if (!session) {
    return (
      <div className="app-screen home-screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ background: '#1e1e1e', padding: '30px', borderRadius: '12px', width: '300px', textAlign: 'center' }}>
          <h2>Admin Login</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '10px', borderRadius: '6px' }} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: '10px', borderRadius: '6px' }} />
            <button type="submit" className="primary-button">LOGIN</button>
            {authError && <p style={{ color: 'red', fontSize: '14px' }}>{authError}</p>}
          </form>
        </div>
      </div>
    );
  }

  /* =================================
     PAGE 1 — HOME
  ================================= */

  if (screen === "home") {
    return (
      <div className="app-screen home-screen">
        <header className="home-header">
          <div className="home-brand">
            <img
              src="/sulfscan-logo.png"
              alt="SULFISCAN Logo"
              className="app-logo"
            />

            <div>
              <h1>SULFISCAN</h1>

              <span className="app-tag">
                SMART WORKER CONTROL
              </span>
            </div>
          </div>
        </header>

        <main className="home-content">
          <div className="hero-badge">
            SMART • FAST • SECURE
          </div>

          <h2 className="home-subtitle">
            Smart Worker.
            <br />

            <span>
              Control & Access.
            </span>
          </h2>

          <p className="home-description">
            A smart barcode-based
            system designed to manage
            worker access, monitor
            entry and exit, and verify
            worker information
            instantly.
          </p>

          <button
            className="start-scan-button"
            onClick={startScanning}
          >
            START SCANNING
          </button>
        </main>

        <div className="moving-features">
          <div className="feature-track">
            <span>SMART BARCODE SCANNING</span>
            <span>REAL-TIME VALIDATION</span>
            <span>SECURE WORKER ACCESS</span>
            <span>ENTRY & EXIT MONITORING</span>
            <span>SCAN HISTORY</span>
            <span>INSTANT STATUS CHECK</span>

            <span>SMART BARCODE SCANNING</span>
            <span>REAL-TIME VALIDATION</span>
            <span>SECURE WORKER ACCESS</span>
            <span>ENTRY & EXIT MONITORING</span>
            <span>SCAN HISTORY</span>
            <span>INSTANT STATUS CHECK</span>
          </div>
        </div>
      </div>
    );
  }

  /* =================================
     PAGE 2 — INTRO
  ================================= */

  if (screen === "intro") {
    return (
      <div className="app-screen intro-screen">
        <button
          className="back-button"
          onClick={() =>
            setScreen("home")
          }
        >
          ← Back
        </button>

        <div className="wristband-image">
          <div className="rfid-wave wave-one"></div>

          <div className="rfid-wave wave-two"></div>

          <div className="rfid-card">
            <div className="rfid-chip"></div>

            <span>SCAN</span>
          </div>

          <div className="wristband-strap"></div>
        </div>

        <h1>Scan Your Wristband</h1>

        <p className="subtitle intro-text">
          Place your worker wristband
          near the scanner for quick
          and secure worker
          verification.
        </p>

        <button
          className="primary-button intro-button"
          onClick={openScanner}
        >
          NEXT →
        </button>
      </div>
    );
  }

  /* =================================
     PAGE 3 — SCANNER
  ================================= */

  if (screen === "scanner") {
    return (
      <div className="app-screen scanning-screen">
        <button
          className="back-button"
          onClick={() =>
            setScreen("intro")
          }
        >
          ← Back
        </button>

        <div className="scan-header">
          <h1>
            Scan Worker Barcode
          </h1>

          <p>
            Position the barcode in
            front of the camera.
          </p>
        </div>

        <div className="camera-box">
          {cameraError ? (
            <div className="camera-placeholder">
              <div className="camera-label">
                CAMERA ERROR
              </div>

              <p
                style={{
                  color: "white",
                  padding: "25px",
                  textAlign: "center",
                }}
              >
                {cameraError}
              </p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video"
              />

              <div className="camera-overlay">
                <div className="camera-label">
                  BARCODE SCANNER ACTIVE
                </div>

                <div className="scanner-frame">
                  <div className="corner top-left"></div>

                  <div className="corner top-right"></div>

                  <div className="corner bottom-left"></div>

                  <div className="corner bottom-right"></div>

                  <div className="scan-line"></div>
                </div>

                <div className="scanner-tap-text">
                  AUTOMATIC BARCODE
                  SCANNING ACTIVE
                </div>
              </div>
            </>
          )}
        </div>

        <div className="camera-status">
          <span className="status-dot"></span>

          <span>
            Camera ready for barcode
            scanning
          </span>
        </div>

        {isScanning && (
          <div className="loading-overlay">
            <div className="scan-loader"></div>

            <p className="loading-text">
              Scanning and verifying
              worker...
            </p>
          </div>
        )}
      </div>
    );
  }

  /* =================================
     RESULT PAGE
  ================================= */

  if (
    screen === "result" &&
    scanResult
  ) {
    return (
      <div className="app-screen result-screen">
        <div className="success-history-header">
          <button
            className="history-button"
            onClick={() =>
              setScreen("history")
            }
          >
            🔎 Search History
          </button>
        </div>

        {scanResult.status ===
          "expired" && (
          <div className="expired-alert-screen">
            <div className="expired-alert-card">
              <div className="expired-pulse">
                !
              </div>

              <div className="expired-warning">
                WARNING
              </div>

              <h1>
                WRISTBAND EXPIRED
              </h1>

              <p className="expired-alert-text">
                This worker's wristband
                has expired and requires
                immediate verification.
              </p>

              <div className="expired-worker-details">
                <div>
                  <span>WORKER NAME</span>

                  <strong>
                    {scanResult.name}
                  </strong>
                </div>

                <div>
                  <span>WORKER ID</span>

                  <strong>
                    {scanResult.workerId}
                  </strong>
                </div>

                <div>
                  <span>BARCODE</span>

                  <strong>
                    {scanResult.barcode}
                  </strong>
                </div>
              </div>

              <button
                className="primary-button"
                onClick={openScanner}
              >
                CONTINUE
              </button>
            </div>
          </div>
        )}

        <div
          className={`result-icon ${scanResult.status}`}
        >
          {scanResult.status === "valid"
            ? "✓"
            : scanResult.status === "expiring"
            ? "!"
            : "✕"}
        </div>

        <h1>Worker Details</h1>

        <div
          className={`status-banner ${scanResult.status}`}
        >
          <div className="status-indicator">
            ●
          </div>

          <div>
            <h3>
              {getStatusText(
                scanResult.status
              )}
            </h3>

            <p>
              {scanResult.status ===
              "valid"
                ? "The wristband is active and access is permitted."
                : scanResult.status ===
                  "expiring"
                ? "The wristband is still active but will expire soon."
                : "The wristband has expired and requires attention."}
            </p>
          </div>
        </div>

        <div className="details-card">
          <div className="detail-row">
            <span className="detail-label">
              NAME
            </span>

            <span>
              {scanResult.name}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">
              WORKER ID
            </span>

            <span>
              {scanResult.workerId}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">
              WORKER UNIT
            </span>

            <span>
              {scanResult.workerUnit}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">
              LOCATION
            </span>

            <span>
              {scanResult.location}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">
              ENTRY / EXIT
            </span>

            <span
              className={`entry-exit-tag ${scanResult.entryExit.toLowerCase()}`}
            >
              {scanResult.entryExit}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">
              BARCODE
            </span>

            <span>
              {scanResult.barcode}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">
              DATE
            </span>

            <span>
              {scanResult.date}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">
              SCAN TIME
            </span>

            <span>
              {scanResult.time}
            </span>
          </div>
        </div>

        <button
          className="primary-button scan-again-button"
          onClick={openScanner}
        >
          SCAN AGAIN
        </button>
      </div>
    );
  }

  /* =================================
     FAILED SCREEN
  ================================= */

  if (screen === "failed") {
    return (
      <div className="app-screen failed-screen">
        <div className="failed-circle">
          !
        </div>

        <h1>
          {scanResult?.alreadyScanned
            ? "Already Scanned"
            : "Scan Failed"}
        </h1>

        {scanResult?.alreadyScanned && (
          <div className="already-scanned-alert">
            <h2>
              {scanResult.name}
            </h2>

            <p>
              Barcode:{" "}
              {scanResult.barcode}
            </p>

            <p>
              Worker ID:{" "}
              {scanResult.workerId}
            </p>
          </div>
        )}

        <div className="failure-message">
          {scanResult?.message ||
            "Unable to verify the worker barcode."}
        </div>

        <button
          className="primary-button"
          onClick={openScanner}
        >
          TRY AGAIN
        </button>

        <button
          className="secondary-button"
          onClick={() =>
            setScreen("home")
          }
        >
          RETURN HOME
        </button>
      </div>
    );
  }

  /* =================================
     HISTORY SCREEN
  ================================= */

  if (screen === "history") {
    return (
      <div className="app-screen history-screen">
        <div className="history-top-bar">
          <button
            className="history-back-button"
            onClick={() =>
              setScreen("result")
            }
          >
            ← Back
          </button>

          {history.length > 0 && (
            <button
              className="clear-history-button"
              onClick={clearHistory}
            >
              Clear History
            </button>
          )}
        </div>

        <h1>
          Search History
        </h1>

        <p className="subtitle">
          Complete record of scanned
          worker wristbands
        </p>

        {history.length === 0 ? (
          <div className="empty-history">
            <div className="history-icon">
              📜
            </div>

            <h2>
              No Scan History
            </h2>

            <p>
              Your scanned workers will
              appear here.
            </p>
          </div>
        ) : (
          <div className="history-list">
            {history.map((record) => (
              <div
                key={record.id}
                className={`history-card ${record.status}`}
              >
                <div className="history-card-header">
                  <div>
                    <h3>
                      {record.name}
                    </h3>

                    <span>
                      {record.workerId}
                    </span>
                  </div>

                  <span
                    className={`status-badge ${record.status}`}
                  >
                    {getStatusText(
                      record.status
                    )}
                  </span>
                </div>

                <div className="history-details">
                  <p>
                    <strong>
                      WORKER UNIT
                    </strong>

                    <span>
                      {record.workerUnit}
                    </span>
                  </p>

                  <p>
                    <strong>
                      LOCATION
                    </strong>

                    <span>
                      {record.location}
                    </span>
                  </p>

                  <p>
                    <strong>
                      ENTRY / EXIT
                    </strong>

                    <span
                      className={`entry-exit-tag ${record.entryExit.toLowerCase()}`}
                    >
                      {record.entryExit}
                    </span>
                  </p>

                  <p>
                    <strong>
                      BARCODE
                    </strong>

                    <span>
                      {record.barcode}
                    </span>
                  </p>

                  <p>
                    <strong>
                      DATE
                    </strong>

                    <span>
                      {record.date}
                    </span>
                  </p>

                  <p>
                    <strong>
                      TIME
                    </strong>

                    <span>
                      {record.time}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default App;