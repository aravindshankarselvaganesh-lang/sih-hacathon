import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../database/offline_database.dart';
import 'app_config.dart';

class SyncService {
  /// Centralized base URL (inject via --dart-define=API_BASE_URL=...).
  static const String apiBaseUrl = AppConfig.baseUrl;

  final String backendBaseUrl;
  final String? authToken;

  SyncService({this.backendBaseUrl = apiBaseUrl, this.authToken});

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        // TODO: wire real auth (e.g. flutter_secure_storage token refresh).
        if (authToken != null && authToken!.isNotEmpty)
          'Authorization': 'Bearer $authToken',
      };

  /// Synchronizes all pending local SQLite records to the central refinery PostgreSQL database.
  /// Retries transient failures with exponential backoff (stub: [maxAttempts]).
  Future<Map<String, dynamic>> syncPendingRecords({int maxAttempts = 3}) async {
    final pendingScans = await OfflineDatabase.instance.getPendingSyncRecords();

    if (pendingScans.isEmpty) {
      return {'success': true, 'synced_count': 0, 'message': 'All records are already synced.'};
    }

    try {
      final payload = {
        'device_id': AppConfig.deviceId,
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

      http.Response? response;
      // Exponential retry stub: retry transient network/5xx errors.
      for (var attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          response = await http
              .post(
                Uri.parse('$backendBaseUrl/sync/batch'),
                headers: _headers,
                body: json.encode(payload),
              )
              .timeout(AppConfig.httpTimeout);
          break; // got a response — per-status handling below decides retry
        } on TimeoutException catch (e, stackTrace) {
          debugPrint('Sync attempt $attempt/$maxAttempts timed out: $e');
          debugPrint('$stackTrace');
          if (attempt == maxAttempts) rethrow;
          await Future.delayed(Duration(seconds: 1 << (attempt - 1)));
        } catch (e) {
          // Connection-level failure (DNS, refused, offline).
          if (attempt == maxAttempts) rethrow;
          debugPrint('Sync attempt $attempt/$maxAttempts failed: $e — retrying');
          await Future.delayed(Duration(seconds: 1 << (attempt - 1)));
        }
      }
      final res = response!;

      if (res.statusCode == 200) {
        // TODO: parse per-record response (e.g. data['results'] with per-UUID
        // accepted/rejected flags) and only mark accepted UUIDs as synced;
        // currently falls back to whole-batch counts.
        final data = json.decode(res.body) as Map<String, dynamic>;
        final List<String> syncedUuids;
        final accepted = data['accepted_uuids'] ?? data['synced_uuids'];
        if (accepted is List) {
          syncedUuids = accepted.map((e) => e.toString()).toList();
        } else {
          syncedUuids = pendingScans.map((s) => s.clientUuid).toList();
        }
        if (syncedUuids.isNotEmpty) {
          await OfflineDatabase.instance.markAsSynced(syncedUuids);
        }

        return {
          'success': true,
          'synced_count': data['synced_count'] ?? syncedUuids.length,
          'message': data['message'] ?? 'Batch synced successfully',
        };
      } else if (res.statusCode == 400) {
        return {
          'success': false,
          'synced_count': 0,
          'message': 'Sync bad request (HTTP 400): ${res.body}',
        };
      } else if (res.statusCode == 401) {
        return {
          'success': false,
          'synced_count': 0,
          'message': 'Sync unauthorized (HTTP 401). Sign in again.',
        };
      } else if (res.statusCode == 403) {
        return {
          'success': false,
          'synced_count': 0,
          'message': 'Sync forbidden (HTTP 403): device not provisioned.',
        };
      } else if (res.statusCode == 409) {
        return {
          'success': false,
          'synced_count': 0,
          'message': 'Sync conflict (HTTP 409): records already exist server-side.',
        };
      } else if (res.statusCode == 422) {
        return {
          'success': false,
          'synced_count': 0,
          'message': 'Sync validation failed (HTTP 422): ${res.body}',
        };
      } else if (res.statusCode == 429) {
        return {
          'success': false,
          'synced_count': 0,
          'message': 'Sync rate-limited (HTTP 429). Retry with backoff.',
        };
      } else if (res.statusCode >= 500) {
        return {
          'success': false,
          'synced_count': 0,
          'message': 'Server error (HTTP ${res.statusCode}). Will retry on next sync.',
        };
      } else {
        return {
          'success': false,
          'synced_count': 0,
          'message': 'Server rejected sync (HTTP ${res.statusCode})',
        };
      }
    } catch (e, stackTrace) {
      debugPrint('SyncService.syncPendingRecords failed: $e');
      debugPrint('$stackTrace');
      return {
        'success': false,
        'synced_count': 0,
        'message': 'Network unavailable. Records safely stored in local SQLite.',
      };
    }
  }
}
