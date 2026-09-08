from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class WorkerBase(BaseModel):
    worker_code: str
    name: str
    department: str
    designation: Optional[str] = "Process Operator"
    blood_group: Optional[str] = "O+"
    emergency_contact: Optional[str] = "+91-9876543210"
    is_active: Optional[bool] = True


class WorkerCreate(WorkerBase):
    pass


class WorkerResponse(WorkerBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
