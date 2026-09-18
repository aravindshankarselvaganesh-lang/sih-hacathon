import 'package:uuid/uuid.dart';

/// Centralized runtime configuration for SULFSCAN mobile app.
///
/// - [baseUrl] is injected via `--dart-define=API_BASE_URL=...`
///   (defaults to Android-emulator loopback for local FastAPI dev).
/// - Exposure thresholds follow DGMS Reg. 124 / OISD-STD-105:
///   5 ppm action, 10 ppm TWA limit, 15 ppm STEL, 100 ppm IDLH.
class AppConfig {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8000/api/v1',
  );

  // H2S compliance thresholds (ppm).
  static const double actionThresholdPpm = 5.0;
  static const double twaLimitPpm = 10.0;
  static const double stelLimitPpm = 15.0;
  static const double idlhLimitPpm = 100.0;

  // Network / sync tuning.
  static const Duration httpTimeout = Duration(seconds: 10);
  static const int maxSyncRetries = 3;

  static String? _deviceId;

  /// Stable-ish per-install device identifier.
  /// Placeholder: generates (and caches) a UUID v4 for this process.
  /// TODO: persist via flutter_secure_storage / shared_preferences so the
  /// id survives restarts, and/or use platform device_info_plus id.
  static String get deviceId => _deviceId ??= const Uuid().v4();

  /// Explicit override (e.g. tests, provisioned terminal id like
  /// 'MOBILE_TERMINAL_01').
  static void setDeviceId(String id) => _deviceId = id;
}
