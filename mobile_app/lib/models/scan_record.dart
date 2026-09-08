class ScanRecord {
  final String clientUuid;
  final String workerCode;
  final String workerName;
  final String department;
  final String badgeUid;
  final String shiftType;
  final String scanEvent;
  final double ambientTempC;
  final double relativeHumidity;
  final String weatherSource;
  final double extractedL;
  final double extractedA;
  final double extractedB;
  final double deltaE;
  final double exposureHours;
  final double cumulativeDosagePpmHr;
  final double avgConcentrationPpm;
  final String complianceStatus; // NORMAL, ACTION_REQUIRED, DANGER_EXCEEDED
  final bool dgmsCompliant;
  final bool oisdCompliant;
  final DateTime scannedAt;
  final bool isSynced;

  const ScanRecord({
    required this.clientUuid,
    required this.workerCode,
    required this.workerName,
    required this.department,
    required this.badgeUid,
    this.shiftType = 'SHIFT_A',
    this.scanEvent = 'EXIT',
    required this.ambientTempC,
    required this.relativeHumidity,
    this.weatherSource = 'SCADA Telemetry',
    required this.extractedL,
    required this.extractedA,
    required this.extractedB,
    required this.deltaE,
    this.exposureHours = 8.0,
    required this.cumulativeDosagePpmHr,
    required this.avgConcentrationPpm,
    required this.complianceStatus,
    required this.dgmsCompliant,
    required this.oisdCompliant,
    required this.scannedAt,
    this.isSynced = false,
  });

  Map<String, dynamic> toMap() {
    return {
      'client_uuid': clientUuid,
      'worker_code': workerCode,
      'worker_name': workerName,
      'department': department,
      'badge_uid': badgeUid,
      'shift_type': shiftType,
      'scan_event': scanEvent,
      'ambient_temp_c': ambientTempC,
      'relative_humidity': relativeHumidity,
      'weather_source': weatherSource,
      'extracted_l': extractedL,
      'extracted_a': extractedA,
      'extracted_b': extractedB,
      'delta_e': deltaE,
      'exposure_hours': exposureHours,
      'cumulative_dosage_ppm_hr': cumulativeDosagePpmHr,
      'avg_concentration_ppm': avgConcentrationPpm,
      'compliance_status': complianceStatus,
      'dgms_compliant': dgmsCompliant ? 1 : 0,
      'oisd_compliant': oisdCompliant ? 1 : 0,
      'scanned_at': scannedAt.toIso8601String(),
      'is_synced': isSynced ? 1 : 0,
    };
  }

  factory ScanRecord.fromMap(Map<String, dynamic> map) {
    return ScanRecord(
      clientUuid: map['client_uuid'] as String,
      workerCode: map['worker_code'] as String,
      workerName: map['worker_name'] as String,
      department: map['department'] as String,
      badgeUid: map['badge_uid'] as String,
      shiftType: map['shift_type'] as String? ?? 'SHIFT_A',
      scanEvent: map['scan_event'] as String? ?? 'EXIT',
      ambientTempC: (map['ambient_temp_c'] as num).toDouble(),
      relativeHumidity: (map['relative_humidity'] as num).toDouble(),
      weatherSource: map['weather_source'] as String? ?? 'SCADA',
      extractedL: (map['extracted_l'] as num).toDouble(),
      extractedA: (map['extracted_a'] as num).toDouble(),
      extractedB: (map['extracted_b'] as num).toDouble(),
      deltaE: (map['delta_e'] as num).toDouble(),
      exposureHours: (map['exposure_hours'] as num?)?.toDouble() ?? 8.0,
      cumulativeDosagePpmHr: (map['cumulative_dosage_ppm_hr'] as num).toDouble(),
      avgConcentrationPpm: (map['avg_concentration_ppm'] as num).toDouble(),
      complianceStatus: map['compliance_status'] as String,
      dgmsCompliant: (map['dgms_compliant'] as int) == 1,
      oisdCompliant: (map['oisd_compliant'] as int) == 1,
      scannedAt: DateTime.parse(map['scanned_at'] as String),
      isSynced: (map['is_synced'] as int) == 1,
    );
  }
}
