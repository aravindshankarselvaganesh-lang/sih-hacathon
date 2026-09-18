class EnvironmentalData {
  final double ambientTempC;
  final double relativeHumidity;
  final String weatherSource;
  final double? latitude;
  final double? longitude;
  /// True when values came from the live network API, false for cached/SCADA fallback.
  final bool isLive;

  const EnvironmentalData({
    required this.ambientTempC,
    required this.relativeHumidity,
    required this.weatherSource,
    this.latitude,
    this.longitude,
    this.isLive = false,
  });

  factory EnvironmentalData.defaultPlantBaseline() {
    return const EnvironmentalData(
      ambientTempC: 31.5,
      relativeHumidity: 63.0,
      weatherSource: 'scada/baseline-cache',
      latitude: 22.3072,
      longitude: 73.1812,
      isLive: false,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'ambient_temp_c': ambientTempC,
      'relative_humidity': relativeHumidity,
      'weather_source': weatherSource,
      'latitude': latitude,
      'longitude': longitude,
    };
  }
}
