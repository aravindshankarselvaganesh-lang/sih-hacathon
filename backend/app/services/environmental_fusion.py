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
import logging
import math
from typing import Dict, Any, Optional
from app.core.config import settings


logger = logging.getLogger(__name__)


def _sanitize_ambient(temp_c: Any, rh: Any) -> Optional[Dict[str, float]]:
    """Fail-closed sanity check: finite + plausible refinery range, else None."""
    try:
        t = float(temp_c)
        h = float(rh)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(t) or not math.isfinite(h):
        return None
    if not (-20.0 <= t <= 60.0 and 0.0 <= h <= 100.0):
        return None
    return {"ambient_temp_c": t, "relative_humidity": h}


class EnvironmentalDataFusion:
    def __init__(self):
        self.scada_mock_temp = 31.4
        self.scada_mock_rh = 64.0
        self._client: Optional[httpx.AsyncClient] = None

    def _get_client(self) -> httpx.AsyncClient:
        """Reuse a single httpx client across calls."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=4.0)
        return self._client

    @staticmethod
    def _resolve_coords(latitude: Optional[float], longitude: Optional[float]):
        # Explicit None check (0.0 is valid, so never use `or`)
        lat = latitude if latitude is not None else settings.DEFAULT_PLANT_LAT
        lon = longitude if longitude is not None else settings.DEFAULT_PLANT_LON
        try:
            lat_f = float(lat)
            lon_f = float(lon)
        except (TypeError, ValueError):
            logger.warning("Invalid lat/lon (%r, %r); using plant defaults.", latitude, longitude)
            return settings.DEFAULT_PLANT_LAT, settings.DEFAULT_PLANT_LON
        if not math.isfinite(lat_f) or not (-90.0 <= lat_f <= 90.0):
            logger.warning("Latitude out of range (%r); using plant default.", latitude)
            lat_f = settings.DEFAULT_PLANT_LAT
        if not math.isfinite(lon_f) or not (-180.0 <= lon_f <= 180.0):
            logger.warning("Longitude out of range (%r); using plant default.", longitude)
            lon_f = settings.DEFAULT_PLANT_LON
        return lat_f, lon_f

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
        lat, lon = self._resolve_coords(latitude, longitude)

        # 1. SCADA Telemetry (Priority 1 for industrial refinery environments)
        if settings.ENABLE_SCADA_MOCK:
            # Simulated plant telemetry with microclimate drift
            sane = _sanitize_ambient(self.scada_mock_temp, self.scada_mock_rh)
            if sane is None:
                # Corrupt mock telemetry must not silently poison dosage math.
                logger.warning("SCADA mock telemetry out of range; using baseline fallback.")
                return {
                    "ambient_temp_c": 30.0,
                    "relative_humidity": 60.0,
                    "weather_source": "Refinery Ambient Baseline Fallback (SCADA rejected)",
                    "latitude": lat,
                    "longitude": lon,
                    "is_fallback": True,
                }
            return {
                "ambient_temp_c": round(sane["ambient_temp_c"], 1),
                "relative_humidity": round(sane["relative_humidity"], 1),
                "weather_source": f"Plant SCADA Tag: {unit_id}_ATM_01",
                "latitude": lat,
                "longitude": lon,
                "is_fallback": False,
            }

        # 2. Weather API (Priority 2 fallback)
        try:
            url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m"
            client = self._get_client()
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                curr = data.get("current", {})
                sane = _sanitize_ambient(
                    curr.get("temperature_2m", 30.0),
                    curr.get("relative_humidity_2m", 60.0),
                )
                if sane is not None:
                    return {
                        "ambient_temp_c": sane["ambient_temp_c"],
                        "relative_humidity": sane["relative_humidity"],
                        "weather_source": "Open-Meteo Meteorological Telemetry",
                        "latitude": lat,
                        "longitude": lon,
                        "is_fallback": False,
                    }
                logger.warning("Weather API returned out-of-range values; using baseline fallback.")
            else:
                logger.warning("Weather API non-200 status %s; using baseline fallback.", resp.status_code)
        except Exception as exc:
            logger.warning("Weather API request failed (%s); using baseline fallback.", exc)

        # 3. Microclimate Baseline Fallback
        return {
            "ambient_temp_c": 30.0,
            "relative_humidity": 60.0,
            "weather_source": "Refinery Ambient Baseline Fallback",
            "latitude": lat,
            "longitude": lon,
            "is_fallback": True,
        }


environmental_fusion = EnvironmentalDataFusion()
