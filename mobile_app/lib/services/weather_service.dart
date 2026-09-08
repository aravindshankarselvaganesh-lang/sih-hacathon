import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/environmental_data.dart';

class WeatherService {
  static const double defaultLat = 22.3072; // Gujarat Refinery coordinates
  static const double defaultLon = 73.1812;

  /// Fetches hyperlocal ambient temperature and humidity for chemical dosimeter kinetics.
  Future<EnvironmentalData> fetchAmbientConditions({double? lat, double? lon}) async {
    final targetLat = lat ?? defaultLat;
    final targetLon = lon ?? defaultLon;

    try {
      final url = Uri.parse(
        'https://api.open-meteo.com/v1/forecast?latitude=$targetLat&longitude=$targetLon&current=temperature_2m,relative_humidity_2m',
      );
      final response = await http.get(url).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final current = data['current'];
        return EnvironmentalData(
          ambientTempC: (current['temperature_2m'] as num).toDouble(),
          relativeHumidity: (current['relative_humidity_2m'] as num).toDouble(),
          weatherSource: 'Meteorological Telemetry API',
          latitude: targetLat,
          longitude: targetLon,
        );
      }
    } catch (_) {
      // Offline fallback: Use plant SCADA telemetry baseline
    }

    return EnvironmentalData.defaultPlantBaseline();
  }
}
