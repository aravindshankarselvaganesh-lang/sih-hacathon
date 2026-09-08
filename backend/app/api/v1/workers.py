"""
Workers API Endpoint
--------------------
Handles worker registration, profile retrieval, and active badge assignments.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.models.worker import Worker
from app.schemas.worker import WorkerCreate, WorkerResponse

router = APIRouter(prefix="/workers", tags=["Workers"])


@router.get("/", response_model=List[WorkerResponse])
async def list_workers(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Worker).offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/", response_model=WorkerResponse)
async def create_worker(worker_in: WorkerCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Worker).where(Worker.worker_code == worker_in.worker_code))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Worker code already registered.")

    worker = Worker(**worker_in.model_dump())
    db.add(worker)
    await db.commit()
    await db.refresh(worker)
    return worker


@router.get("/{worker_code}", response_model=WorkerResponse)
async def get_worker(worker_code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Worker).where(Worker.worker_code == worker_code))
    worker = result.scalars().first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found.")
    return worker
