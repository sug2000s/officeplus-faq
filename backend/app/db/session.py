"""Async SQLAlchemy session helpers for the new service."""
import logging
from contextlib import asynccontextmanager

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings

logger = logging.getLogger(__name__)

_pool_size = settings.postgres_pool_min
_max_overflow = max(settings.postgres_pool_max - _pool_size, 0)

engine: AsyncEngine = create_async_engine(
    settings.postgres_dsn,
    pool_pre_ping=True,
    pool_size=_pool_size,
    max_overflow=_max_overflow,
    echo=settings.log_level.upper() == "DEBUG",
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    expire_on_commit=False,
)


@asynccontextmanager
async def lifespan_session() -> AsyncSession:
    """Provide a lifespan-scoped database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_db() -> AsyncSession:
    """FastAPI dependency that yields a session per request."""
    async with AsyncSessionLocal() as session:
        yield session


async def check_database_connection() -> None:
    """Validate that the Postgres connection works."""
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        logger.info("✅ Postgres 연결 확인 완료")
    except SQLAlchemyError as exc:
        logger.exception("❌ Postgres 연결 확인 실패")
        raise exc
