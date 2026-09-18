import 'dart:math';

class OnnxDosimeterInference {
  // Unified limits (ppm) — keep in sync with backend/app/services/calibration_ai.py
  // and ml_calibration/export_onnx.py. TWA=10 (8-hr), ACTION=5, STEL=15 (15-min), IDLH=100 (ceiling).
  static const double twaLimit = 10.0;    // DGMS 8-hr Time-Weighted Average Limit (ppm)
  static const double actionLimit = 5.0;  // DGMS Action Level (ppm)
  static const double stelLimit = 15.0;   // Short-Term Exposure Limit, 15-min window (ppm)
  static const double idlhLimit = 100.0;  // Immediately Dangerous to Life or Health, ceiling (ppm)
  static const double kFactor = 3.8;      // Lead Acetate Spectrophotometer Sensitivity

  /// Analytical (closed-form) H2S dosimeter calibration model mirroring the
  /// exported ONNX regression weights — not a live onnxruntime session.
  ///
  /// [stelPeak] (optional, ppm): 15-min peak stub. If provided and
  /// > [stelLimit] (15.0), result is STEL_EXCEEDED fail-closed regardless
  /// of 8-hr TWA. Optional so existing callers are unaffected.
  static Map<String, dynamic> predictExposure({
    required double deltaE,
    required double ambientTempC,
    required double relativeHumidity,
    double exposureHours = 8.0,
    double? stelPeak,
  }) {
    if (!deltaE.isFinite || deltaE < 0) {
      throw ArgumentError.value(deltaE, 'deltaE', 'must be finite and >= 0');
    }
    if (!ambientTempC.isFinite || ambientTempC < -20 || ambientTempC > 60) {
      throw ArgumentError.value(ambientTempC, 'ambientTempC', 'must be in [-20, 60] °C');
    }
    if (!relativeHumidity.isFinite || relativeHumidity < 0 || relativeHumidity > 100) {
      throw ArgumentError.value(relativeHumidity, 'relativeHumidity', 'must be in [0, 100] %');
    }
    if (stelPeak != null && (!stelPeak.isFinite)) {
      throw ArgumentError.value(stelPeak, 'stelPeak', 'must be finite or null');
    }
    if (!exposureHours.isFinite) {
      throw ArgumentError.value(exposureHours, 'exposureHours', 'must be finite');
    }
    final duration = max(exposureHours, 0.1);

    // Temperature & Humidity kinetic correction (Arrhenius formulation)
    final tempFactor = max(0.5, 1.0 + 0.012 * (ambientTempC - 25.0));
    final rhFactor = max(0.5, 1.0 + 0.008 * (relativeHumidity - 50.0));

    final normalizedE = deltaE / (kFactor * tempFactor * rhFactor);
    final cumulativeDosage = pow(normalizedE, 2).toDouble();
    final avgPpm = cumulativeDosage / duration;

    String status;
    bool dgmsCompliant;
    bool oisdCompliant;
    String message;

    // STEL peak stub (fail-closed): 15-min peak over stelLimit forces
    // STEL_EXCEEDED independent of 8-hr TWA outcome.
    if (stelPeak != null && stelPeak > stelLimit) {
      status = 'STEL_EXCEEDED';
      dgmsCompliant = false;
      oisdCompliant = false;
      message = 'ALERT: 15-min STEL peak (${stelPeak.toStringAsFixed(2)} ppm > 15 ppm)! Evacuate & follow STEL protocol.';
    } else if (avgPpm < actionLimit) {
      status = 'NORMAL';
      dgmsCompliant = true;
      oisdCompliant = true;
      message = 'Safe shift level (${avgPpm.toStringAsFixed(2)} ppm). Fully DGMS & OISD compliant.';
    } else if (avgPpm <= twaLimit) {
      status = 'ACTION_REQUIRED';
      dgmsCompliant = true;
      oisdCompliant = true;
      message = 'Caution: Approaching TWA limit (${avgPpm.toStringAsFixed(2)} ppm). Shift review required.';
    } else {
      status = 'DANGER_EXCEEDED';
      dgmsCompliant = false;
      oisdCompliant = false;
      message = 'ALERT: TWA Limit Exceeded (${avgPpm.toStringAsFixed(2)} ppm > 10 ppm)! Immediate evacuation & medical clearance.';
    }

    return {
      'cumulative_dosage_ppm_hr': double.parse(cumulativeDosage.toStringAsFixed(2)),
      'avg_concentration_ppm': double.parse(avgPpm.toStringAsFixed(2)),
      'compliance_status': status,
      'dgms_compliant': dgmsCompliant,
      'oisd_compliant': oisdCompliant,
      'message': message,
    };
  }
}
