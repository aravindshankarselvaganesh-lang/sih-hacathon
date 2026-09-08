import 'dart:convert';
import 'package:http/http.dart' as http;
import '../database/offline_database.dart';
import '../models/scan_record.dart';

class SyncService {
  final String backendBaseUrl;

  SyncService({this.backendBaseUrl = 'http://10.0.2.2:8000/api/v1'});

  /// Synchronizes all pending local SQLite records to the central refinery PostgreSQL database.
  Future<Map<String, dynamic>> syncPendingRecords() async {
    final pendingScans = await OfflineDatabase.instance.getPendingSyncRecords();

    if (pendingScans.isEmpty) {
      return {'success': true, 'synced_count': 0, 'message': 'All records are already synced.'};
    }

    try {
      final payload = {
        'device_id': 'MOBILE_TERMINAL_01',
        'records': pendingScans.map((r) => {
          'client_uuid': r.clientUuid,
          'worker_code': r.workerCode,
          'badge_uid': r.badgeUid,
          'shift_type': r.shiftType,
          'scan_event': r.scanEvent,
          'location_name': 'Refinery Zone-01',
          'ambient_temp_c': r.ambientTempC,
          'relative_humidity': r.relativeHumidity,
          'weather_source': r.weatherSource,
          'extracted_l': r.extractedL,
          'extracted_a': r.extractedA,
          'extracted_b': r.extractedB,
          'delta_e': r.deltaE,
          'exposure_hours': r.exposureHours,
          'cumulative_dosage_ppm_hr': r.cumulativeDosagePpmHr,
          'avg_concentration_ppm': r.avgConcentrationPpm,
          'compliance_status': r.complianceStatus,
          'dgms_compliant': r.dgmsCompliant,
          'oisd_compliant': r.oisdCompliant,
          'scanned_at': r.scannedAt.toIso8601String(),
        }).toList(),
      };

      final response = await http.post(
        Uri.parse('$backendBaseUrl/sync/batch'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(payload),
      ).timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final List<String> syncedUuids = pendingScans.map((s) => s.clientUuid).toList();
        await OfflineDatabase.instance.markAsSynced(syncedUuids);

        final data = json.decode(response.body);
        return {
          'success': true,
          'synced_count': data['synced_count'] ?? syncedUuids.length,
          'message': data['message'] ?? 'Batch synced successfully',
        };
      } else {
        return {
          'success': false,
          'synced_count': 0,
          'message': 'Server rejected sync (HTTP ${response.statusCode})',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'synced_count': 0,
        'message': 'Network unavailable. Records safely stored in local SQLite.',
      };
    }
  }
}
