"""Entry point for the FastAPI backend service."""
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI


def load_environment():
    """Load the base .env and APP_ENV-specific overrides (e.g. .env.local)."""
    backend_dir = Path(__file__).resolve().parent.parent
    default_env = backend_dir / ".env"

    if default_env.exists():
        load_dotenv(default_env, override=False)

    app_env = (os.getenv("APP_ENV") or os.getenv("ENVIRONMENT") or "").strip().lower()
    candidate_files = []

    if app_env:
        candidate_files.append(backend_dir / f".env.{app_env}")

    # Ensure legacy .env.local naming is honored for local development.
    if not app_env or app_env == "local":
        local_env = backend_dir / ".env.local"
        if local_env not in candidate_files:
            candidate_files.append(local_env)

    for env_file in candidate_files:
        if env_file.exists():
            load_dotenv(env_file, override=True)
            break


load_environment()
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.redis import RedisSessionManager
from app.utils.middleware import SessionMiddleware
from app.api import router as service_router
from app.config import settings
from app.db.session import check_database_connection

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize shared resources for the service lifecycle."""
    redis_manager: Optional[RedisSessionManager] = None
    try:
        logger.info("🔄 FastAPI service 초기화 시작")
        await check_database_connection()

        redis_manager = RedisSessionManager()
        await redis_manager.connect()
        app.state.session_manager = redis_manager
        logger.info("✅ Redis Session Manager 초기화 완료")

        yield
    finally:
        if redis_manager:
            await redis_manager.disconnect()
        logger.info("🛑 FastAPI service 종료 완료")


app = FastAPI(
    title="OfficePlus FAQ Backend",
    version="0.1.0",
    docs_url="/p/faq/docs",
    redoc_url="/p/faq/redoc",
    lifespan=lifespan,
)

# Enable very permissive CORS for now (same as the existing service)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach the existing session middleware to reuse Redis validation
app.add_middleware(SessionMiddleware)

# Register routers
app.include_router(service_router)


class SPAStaticFiles(StaticFiles):
    """StaticFiles subclass that falls back to index.html for SPA routes."""

    async def get_response(self, path: str, scope):
        response = await super().get_response(path, scope)
        if response.status_code == 404:
            return await super().get_response("index.html", scope)
        return response


def mount_frontend(app_instance: FastAPI):
    frontend_dir = settings.frontend_dist
    if not frontend_dir.exists():
        logger.info(f"프런트엔드 빌드 경로를 찾을 수 없습니다: {frontend_dir}")
        return

    mount_path = settings.frontend_mount_path
    app_instance.mount(
        mount_path,
        SPAStaticFiles(directory=str(frontend_dir), html=True),
        name="frontend",
    )
    logger.info(f"✅ Frontend 정적 파일 서빙: {frontend_dir} -> {mount_path}")


mount_frontend(app)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload,
        log_level=settings.log_level.lower(),
    )
