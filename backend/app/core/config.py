from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "SULFSCAN H2S Dosimeter & Refinery Safety System"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database Configuration (Defaults to SQLite for local development, easily configured to PostgreSQL)
    DATABASE_URL: str = "sqlite+aiosqlite:///./refinery_safety.db"
    
    # Environmental Data API (Weather / SCADA Integration)
    OPENWEATHER_API_KEY: Optional[str] = "demo_weather_key"
    DEFAULT_PLANT_LAT: float = 22.3072   # Gujarat Refinery (IOCL Vadodara) coordinates as industrial benchmark
    DEFAULT_PLANT_LON: float = 73.1812
    
    # SCADA Mock/Integration toggle
    ENABLE_SCADA_MOCK: bool = True
    
    # Compliance Standards
    DGMS_TWA_LIMIT_PPM: float = 10.0
    DGMS_STEL_LIMIT_PPM: float = 15.0
    DGMS_ACTION_LIMIT_PPM: float = 5.0
    
    OISD_STD_105_COMPLIANT: bool = True
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = Settings()
