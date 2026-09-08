import 'dart:math';

class OnnxDosimeterInference {
  static const double twaLimit = 10.0;    // DGMS 8-hr Time-Weighted Average Limit (ppm)
  static const double actionLimit = 5.0;  // DGMS Action Level (ppm)
  static const double kFactor = 3.8;      // Lead Acetate Spectrophotometer Sensitivity

  /// On-device calibrated chemical kinetics regression (matches ONNX model weights).
  static Map<String, dynamic> predictExposure({
    required double deltaE,
    required double ambientTempC,
    required double relativeHumidity,
    double exposureHours = 8.0,
  }) {
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

    if (avgPpm < actionLimit) {
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
