class EnvironmentalData {
  final double ambientTempC;
  final double relativeHumidity;
  final String weatherSource;
  final double? latitude;
  final double? longitude;

  const EnvironmentalData({
    required this.ambientTempC,
    required this.relativeHumidity,
    required this.weatherSource,
    this.latitude,
    this.longitude,
  });

  factory EnvironmentalData.defaultPlantBaseline() {
    return const EnvironmentalData(
      ambientTempC: 31.5,
      relativeHumidity: 63.0,
      weatherSource: 'SCADA Plant Telemetry Cache',
      latitude: 22.3072,
      longitude: 73.1812,
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
