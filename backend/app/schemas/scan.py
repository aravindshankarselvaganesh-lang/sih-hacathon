from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class DosimeterAnalysisRequest(BaseModel):
    worker_code: str
    badge_uid: str
    exposure_hours: float = 8.0
    shift_type: str = "SHIFT_A"
    scan_event: str = "EXIT"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    # Optional direct values if CV processed on device:
    extracted_L: Optional[float] = None
    extracted_a: Optional[float] = None
    extracted_b: Optional[float] = None
    ambient_temp_c: Optional[float] = None
    relative_humidity: Optional[float] = None


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
    client_uuid: str
    worker_code: str
    badge_uid: str
    shift_type: str = "SHIFT_A"
    scan_event: str = "EXIT"
    location_name: str = "Refinery Processing Zone"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    ambient_temp_c: float
    relative_humidity: float
    weather_source: str = "Mobile Weather Cache"
    extracted_L: float
    extracted_a: float
    extracted_b: float
    delta_E: float
    exposure_hours: float = 8.0
    cumulative_dosage_ppm_hr: float
    avg_concentration_ppm: float
    compliance_status: str
    dgms_compliant: bool
    oisd_compliant: bool
    scanned_at: datetime


class BatchSyncRequest(BaseModel):
    device_id: str
    records: List[OfflineSyncRecord]


class BatchSyncResponse(BaseModel):
    synced_count: int
    rejected_count: int
    message: str
