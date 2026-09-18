import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings


logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


def _build_engine_kwargs() -> dict:
    """Env-driven engine kwargs: sqlite needs check_same_thread, postgres needs pool_pre_ping."""
    url = settings.DATABASE_URL
    if url.startswith("sqlite"):
        return {"connect_args": {"check_same_thread": False}}
    return {"pool_pre_ping": True, "pool_size": 5, "max_overflow": 10}


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    **_build_engine_kwargs(),
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for providing an async database session per request."""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Create all database tables on application startup."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables initialized successfully.")
    except Exception as exc:
        logger.exception("Failed to initialize database tables: %s", exc)
        raise
