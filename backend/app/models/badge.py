from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    badge_uid = Column(String(64), unique=True, index=True, nullable=False)   # DataMatrix payload e.g. BDG-7749-X
    batch_number = Column(String(50), nullable=False)                          # Chemical dosimeter production lot
    assigned_worker_id = Column(Integer, ForeignKey("workers.id"), nullable=True)
    
    # Spectrophotometer Batch Calibration Coefficients
    k_calibration = Column(Float, default=3.8)                                # Sensitivity constant
    baseline_L = Column(Float, default=92.8)                                   # Virgin strip lightness
    baseline_a = Column(Float, default=-1.2)
    baseline_b = Column(Float, default=5.4)
    
    expiry_date = Column(Date, default=date.today)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    worker = relationship("Worker", back_populates="badges")
    scans = relationship("ScanRecord", back_populates="badge")
