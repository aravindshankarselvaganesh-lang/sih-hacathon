import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/environmental_data.dart';

class WeatherService {
  static const double defaultLat = 22.3072; // Gujarat Refinery coordinates
  static const double defaultLon = 73.1812;

  /// Unified weatherSource vocabulary:
  /// - live fetch: 'open-meteo/live'
  /// - fallback:   'scada/baseline-cache'
  static const String liveSource = 'open-meteo/live';
  static const String fallbackSource = 'scada/baseline-cache';

  /// Fetches hyperlocal ambient temperature and humidity for chemical dosimeter kinetics.
  Future<EnvironmentalData> fetchAmbientConditions({double? lat, double? lon}) async {
    final targetLat = lat ?? defaultLat;
    final targetLon = lon ?? defaultLon;

    // TODO(geolocator): request Geolocator.checkPermission()/requestPermission()
    // and use Geolocator.getCurrentPosition() for [lat]/[lon] when granted;
    // fall back to [defaultLat]/[defaultLon] when denied. Requires adding
    // `geolocator` to pubspec.yaml and platform permission strings.

    try {
      final url = Uri.parse(
        'https://api.open-meteo.com/v1/forecast?latitude=$targetLat&longitude=$targetLon&current=temperature_2m,relative_humidity_2m',
      );
      final response = await http.get(url).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as Map<String, dynamic>;
        final current = data['current'] as Map<String, dynamic>?;
        final temp = (current?['temperature_2m'] as num?)?.toDouble();
        final rh = (current?['relative_humidity_2m'] as num?)?.toDouble();
        if (temp != null && rh != null) {
          return EnvironmentalData(
            ambientTempC: temp,
            relativeHumidity: rh,
            weatherSource: liveSource,
            latitude: targetLat,
            longitude: targetLon,
            isLive: true, // live network reading
          );
        }
        // Missing fields -> fall through to SCADA baseline cache.
      }
    } catch (_) {
      // Offline fallback: Use plant SCADA telemetry baseline
    }

    final fallback = EnvironmentalData.defaultPlantBaseline();
    return EnvironmentalData(
      ambientTempC: fallback.ambientTempC,
      relativeHumidity: fallback.relativeHumidity,
      weatherSource: fallbackSource,
      latitude: fallback.latitude,
      longitude: fallback.longitude,
      isLive: false, // cached fallback, not live
    );
  }
}
