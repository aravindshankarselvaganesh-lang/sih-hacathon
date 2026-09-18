from typing import List, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "SULFSCAN H2S Dosimeter & Refinery Safety System"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"

    # Environment: dev | staging | prod
    ENV: str = "dev"

    # API key for protecting write/mutation endpoints (X-API-Key header).
    # None = auth bypass in dev (with warning log); must be set in prod.
    API_KEY: Optional[str] = None

    # CORS origins (comma-separated in env or JSON list). No wildcard by default.
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _parse_cors_origins(cls, v):
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return []
            # Support comma-separated string from env var
            if v.startswith("["):
                import json
                try:
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return [str(x).strip() for x in parsed if str(x).strip()]
                except Exception:
                    pass
            return [x.strip() for x in v.split(",") if x.strip()]
        return v

    # Database Configuration (Defaults to SQLite for local development, easily configured to PostgreSQL)
    DATABASE_URL: str = "sqlite+aiosqlite:///./refinery_safety.db"

    # Environmental Data API (Weather / SCADA Integration)
    OPENWEATHER_API_KEY: Optional[str] = None
    DEFAULT_PLANT_LAT: float = 22.3072   # Gujarat Refinery (IOCL Vadodara) coordinates as industrial benchmark
    DEFAULT_PLANT_LON: float = 73.1812

    # SCADA Mock/Integration toggle (default off; enable explicitly in dev)
    ENABLE_SCADA_MOCK: bool = False

    # Compliance Standards
    DGMS_TWA_LIMIT_PPM: float = 10.0
    DGMS_STEL_LIMIT_PPM: float = 15.0
    DGMS_ACTION_LIMIT_PPM: float = 5.0

    OISD_STD_105_COMPLIANT: bool = True

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = Settings()
