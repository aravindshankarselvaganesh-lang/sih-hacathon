from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class DosimeterAnalysisRequest(BaseModel):
    worker_code: str = Field(..., min_length=1, max_length=64, pattern=r"^WRK-\d+$")
    badge_uid: str = Field(..., min_length=1, max_length=64, pattern=r"^BDG-[A-Z0-9-]+$")
    exposure_hours: float = Field(8.0, gt=0, le=24)
    shift_type: str = Field("SHIFT_A", min_length=1, max_length=20)
    scan_event: str = Field("EXIT", min_length=1, max_length=20)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    # Optional direct values if CV processed on device:
    extracted_L: Optional[float] = Field(None, ge=0, le=100)
    extracted_a: Optional[float] = Field(None, ge=-128, le=127)
    extracted_b: Optional[float] = Field(None, ge=-128, le=127)
    ambient_temp_c: Optional[float] = Field(None, ge=-20, le=60)
    relative_humidity: Optional[float] = Field(None, ge=0, le=100)


class DosimeterAnalysisResponse(BaseModel):
    success: bool
    worker_code: str
    worker_name: str
    department: str
    badge_uid: str
    delta_E: float
    cumulative_dosage_ppm_hr: float
    avg_concentration_ppm: float
    ambient_temp_c: float
    relative_humidity: float
    weather_source: str
    compliance_status: str     # NORMAL / ACTION_REQUIRED / DANGER_EXCEEDED
    dgms_compliant: bool
    oisd_compliant: bool
    message: str


class OfflineSyncRecord(BaseModel):
    client_uuid: str = Field(..., min_length=1, max_length=64)
    worker_code: str = Field(..., min_length=1, max_length=64)
    badge_uid: str = Field(..., min_length=1, max_length=64)
    shift_type: str = Field("SHIFT_A", max_length=20)
    scan_event: str = Field("EXIT", max_length=20)
    location_name: str = Field("Refinery Processing Zone", max_length=200)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    ambient_temp_c: float = Field(..., ge=-20, le=60)
    relative_humidity: float = Field(..., ge=0, le=100)
    weather_source: str = Field("Mobile Weather Cache", max_length=50)
    extracted_L: float = Field(..., ge=0, le=100)
    extracted_a: float = Field(..., ge=-128, le=127)
    extracted_b: float = Field(..., ge=-128, le=127)
    delta_E: float = Field(..., ge=0, le=200)
    exposure_hours: float = Field(8.0, gt=0, le=24)
    cumulative_dosage_ppm_hr: float = Field(..., ge=0)
    avg_concentration_ppm: float = Field(..., ge=0)
    compliance_status: str = Field(..., max_length=30)
    dgms_compliant: bool
    oisd_compliant: bool
    scanned_at: datetime


class BatchSyncRequest(BaseModel):
    device_id: str = Field(..., min_length=1, max_length=64)
    records: List[OfflineSyncRecord] = Field(..., min_length=1, max_length=200)


class BatchSyncResponse(BaseModel):
    synced_count: int
    rejected_count: int
    message: str
