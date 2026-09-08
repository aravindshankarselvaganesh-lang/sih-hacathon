from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    worker_code = Column(String(50), unique=True, index=True, nullable=False)  # e.g., WRK-1024
    name = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)                           # e.g., Hydrocracker Unit
    designation = Column(String(100), default="Process Operator")
    blood_group = Column(String(10), default="O+")
    emergency_contact = Column(String(50), default="+91-9876543210")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    scans = relationship("ScanRecord", back_populates="worker", cascade="all, delete-orphan")
    badges = relationship("Badge", back_populates="worker")
