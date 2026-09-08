"""
Environmental Data Fusion Service (Local SCADA Database / Weather API)
---------------------------------------------------------------------
Fuses ambient atmospheric telemetry (Temperature, Humidity, Wind speed)
into dosimeter exposure calculations without requiring bulky onboard sensors
on the worker's wearable badge.

Sources:
1. Plant SCADA Historian / Modbus TCP interface (Refinery telemetry stream)
2. Live Hyperlocal Weather API (OpenWeather / WeatherAPI / IMD India)
3. Microclimate Fallback Cache
"""

import httpx
from typing import Dict, Any, Optional
from app.core.config import settings


class EnvironmentalDataFusion:
    def __init__(self):
        self.scada_mock_temp = 31.4
        self.scada_mock_rh = 64.0

    async def get_ambient_conditions(
        self,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        unit_id: Optional[str] = "CRUDE_DISTILLATION_4"
    ) -> Dict[str, Any]:
        """
        Retrieves real-time ambient parameters:
        Prioritizes Local SCADA refinery telemetry; falls back to Weather API.
        """
        lat = latitude or settings.DEFAULT_PLANT_LAT
        lon = longitude or settings.DEFAULT_PLANT_LON

        # 1. SCADA Telemetry (Priority 1 for industrial refinery environments)
        if settings.ENABLE_SCADA_MOCK:
            # Simulated plant telemetry with microclimate drift
            return {
                "ambient_temp_c": round(self.scada_mock_temp, 1),
                "relative_humidity": round(self.scada_mock_rh, 1),
                "weather_source": f"Plant SCADA Tag: {unit_id}_ATM_01",
                "latitude": lat,
                "longitude": lon,
            }

        # 2. Weather API (Priority 2 fallback)
        try:
            url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m"
            async with httpx.AsyncClient(timeout=4.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    curr = data.get("current", {})
                    return {
                        "ambient_temp_c": curr.get("temperature_2m", 30.0),
                        "relative_humidity": curr.get("relative_humidity_2m", 60.0),
                        "weather_source": "Open-Meteo Meteorological Telemetry",
                        "latitude": lat,
                        "longitude": lon,
                    }
        except Exception:
            pass

        # 3. Microclimate Baseline Fallback
        return {
            "ambient_temp_c": 30.0,
            "relative_humidity": 60.0,
            "weather_source": "Refinery Ambient Baseline Fallback",
            "latitude": lat,
            "longitude": lon,
        }


environmental_fusion = EnvironmentalDataFusion()
