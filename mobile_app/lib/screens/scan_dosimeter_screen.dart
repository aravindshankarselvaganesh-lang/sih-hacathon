import 'dart:math';
import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../models/worker_badge.dart';
import '../models/scan_record.dart';
import '../services/barcode_service.dart';
import '../services/weather_service.dart';
import '../services/onnx_inference.dart';
import '../database/offline_database.dart';
import 'scan_result_screen.dart';

class ScanDosimeterScreen extends StatefulWidget {
  const ScanDosimeterScreen({Key? key}) : super(key: key);

  @override
  State<ScanDosimeterScreen> createState() => _ScanDosimeterScreenState();
}

class _ScanDosimeterScreenState extends State<ScanDosimeterScreen> {
  WorkerBadge? _selectedWorker;
  bool _isFlashOn = false;
  bool _isProcessing = false;
  final List<WorkerBadge> _demoWorkers = BarcodeService.getDemoBadges();

  @override
  void initState() {
    super.initState();
    _selectedWorker = _demoWorkers.first;
  }

  Future<void> _executeOneShotCapture() async {
    if (_selectedWorker == null) return;

    setState(() => _isProcessing = true);

    // 1. Environmental Telemetry Fusion (Weather API / Plant SCADA)
    final env = await WeatherService().fetchAmbientConditions();

    // 2. Simulated OpenCV colorimetric extraction (CIE L*a*b* delta from virgin strip)
    // Random representative exposure for demo simulation:
    final rand = Random();
    final deltaE = 8.0 + rand.nextDouble() * 38.0; // 8 to 46 delta_E
    final extractedL = 92.8 - (deltaE * 0.8);
    final extractedA = -1.2 + (deltaE * 0.25);
    final extractedB = 5.4 + (deltaE * 0.35);

    // 3. AI / Calibration Model Inference (ONNX Runtime logic)
    final result = OnnxDosimeterInference.predictExposure(
      deltaE: deltaE,
      ambientTempC: env.ambientTempC,
      relativeHumidity: env.relativeHumidity,
      exposureHours: 8.0,
    );

    // 4. Save to Offline-First SQLite Database
    final record = ScanRecord(
      clientUuid: const Uuid().v4(),
      workerCode: _selectedWorker!.workerCode,
      workerName: _selectedWorker!.workerName,
      department: _selectedWorker!.department,
      badgeUid: _selectedWorker!.badgeUid,
      ambientTempC: env.ambientTempC,
      relativeHumidity: env.relativeHumidity,
      weatherSource: env.weatherSource,
      extractedL: extractedL,
      extractedA: extractedA,
      extractedB: extractedB,
      deltaE: deltaE,
      exposureHours: 8.0,
      cumulativeDosagePpmHr: result['cumulative_dosage_ppm_hr'] as double,
      avgConcentrationPpm: result['avg_concentration_ppm'] as double,
      complianceStatus: result['compliance_status'] as String,
      dgmsCompliant: result['dgms_compliant'] as bool,
      oisdCompliant: result['oisd_compliant'] as bool,
      scannedAt: DateTime.now(),
      isSynced: false,
    );

    await OfflineDatabase.instance.insertScan(record);

    setState(() => _isProcessing = false);

    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => ScanResultScreen(record: record)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('One-Shot Badge Capture', style: TextStyle(color: Colors.white, fontSize: 16)),
        actions: [
          IconButton(
            icon: Icon(_isFlashOn ? Icons.flash_on : Icons.flash_off, color: Colors.amber),
            onPressed: () => setState(() => _isFlashOn = !_isFlashOn),
            tooltip: 'Toggle LED Torch',
          ),
        ],
      ),
      body: Stack(
        children: [
          // Camera Simulation Viewport
          Center(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 24),
              aspectRatio: 1.0,
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFF38BDF8), width: 2),
              ),
              child: Stack(
                children: [
                  // Chemical Dosimeter Badge Simulation Graphic
                  Center(
                    child: Container(
                      width: 200,
                      height: 200,
                      decoration: BoxDecoration(
                        color: const Color(0xFFE2E8F0),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 15)],
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              Container(width: 24, height: 24, color: Colors.white, child: const Center(child: Text('W', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold)))),
                              Text(_selectedWorker?.badgeUid ?? 'BDG-7749', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                              Container(width: 24, height: 24, color: Colors.black, child: const Center(child: Text('B', style: TextStyle(fontSize: 9, color: Colors.white, fontWeight: FontWeight.bold)))),
                            ],
                          ),
                          const SizedBox(height: 12),
                          // Reactive Strip
                          Container(
                            width: 100,
                            height: 60,
                            decoration: BoxDecoration(
                              color: const Color(0xFFC7B198),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: Colors.brown.shade400),
                            ),
                            child: const Center(
                              child: Text('Pb(Ac)₂ Strip\n(H₂S Reactive)', textAlign: TextAlign.center, style: TextStyle(fontSize: 9, color: Colors.black87, fontWeight: FontWeight.bold)),
                            ),
                          ),
                          const SizedBox(height: 12),
                          const Text('2D DataMatrix (ZXing / ZBar)', style: TextStyle(fontSize: 8, color: Colors.black54)),
                        ],
                      ),
                    ),
                  ),

                  // Optical Viewfinder Reticles
                  Positioned(
                    top: 16,
                    left: 16,
                    child: Container(width: 30, height: 30, decoration: const BoxDecoration(border: Border(top: BorderSide(color: Color(0xFF0284C7), width: 4), left: BorderSide(color: Color(0xFF0284C7), width: 4)))),
                  ),
                  Positioned(
                    top: 16,
                    right: 16,
                    child: Container(width: 30, height: 30, decoration: const BoxDecoration(border: Border(top: BorderSide(color: Color(0xFF0284C7), width: 4), right: BorderSide(color: Color(0xFF0284C7), width: 4)))),
                  ),
                  Positioned(
                    bottom: 16,
                    left: 16,
                    child: Container(width: 30, height: 30, decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFF0284C7), width: 4), left: BorderSide(color: Color(0xFF0284C7), width: 4)))),
                  ),
                  Positioned(
                    bottom: 16,
                    right: 16,
                    child: Container(width: 30, height: 30, decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFF0284C7), width: 4), right: BorderSide(color: Color(0xFF0284C7), width: 4)))),
                  ),

                  if (_isProcessing)
                    Container(
                      color: Colors.black54,
                      child: const Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            CircularProgressIndicator(color: Color(0xFF38BDF8)),
                            SizedBox(height: 16),
                            Text('OpenCV Warping & LAB Colorimetry...', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // Bottom Controls
          Positioned(
            bottom: 30,
            left: 20,
            right: 20,
            child: Column(
              children: [
                // Worker selector / DataMatrix binding
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A).withOpacity(0.9),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF334155)),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<WorkerBadge>(
                      value: _selectedWorker,
                      dropdownColor: const Color(0xFF0F172A),
                      isExpanded: true,
                      items: _demoWorkers.map((w) {
                        return DropdownMenuItem<WorkerBadge>(
                          value: w,
                          child: Text(
                            '${w.workerCode} - ${w.workerName} (${w.badgeUid})',
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                          ),
                        );
                      }).toList(),
                      onChanged: (val) => setState(() => _selectedWorker = val),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                ElevatedButton.icon(
                  onPressed: _isProcessing ? null : _executeOneShotCapture,
                  icon: const Icon(Icons.camera_enhance, size: 22),
                  label: const Text('CAPTURE & ANALYZE DOSIMETER', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0284C7),
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 54),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
