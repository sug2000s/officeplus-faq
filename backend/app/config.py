"""Application configuration."""
import os
from functools import cached_property
from pathlib import Path
from typing import Optional
from urllib.parse import quote_plus


class Settings:
    """Application settings."""

    def __init__(self):
        """Initialize settings."""
        pass

    @cached_property
    def environment(self) -> str:
        """Get environment."""
        return os.getenv("ENVIRONMENT", os.getenv("APP_ENV", "local"))

    @cached_property
    def log_level(self) -> str:
        """Get log level."""
        return os.getenv("LOG_LEVEL", "INFO").upper()

    # API Settings
    @cached_property
    def api_host(self) -> str:
        """Get API host."""
        return os.getenv("API_HOST", "0.0.0.0")

    @cached_property
    def api_port(self) -> int:
        """Get API port."""
        return int(os.getenv("API_PORT", "8000"))

    @cached_property
    def api_reload(self) -> bool:
        """Get API reload setting."""
        return os.getenv("API_RELOAD", "false").lower() == "true"

    # PostgreSQL Settings
    @cached_property
    def postgres_host(self) -> str:
        """Get PostgreSQL host."""
        return os.getenv("POSTGRES_HOST", "localhost")

    @cached_property
    def postgres_port(self) -> int:
        """Get PostgreSQL port."""
        return int(os.getenv("POSTGRES_PORT", "5432"))

    @cached_property
    def postgres_db(self) -> str:
        """Get PostgreSQL database."""
        return os.getenv("POSTGRES_DB", "postgres")

    @cached_property
    def postgres_user(self) -> str:
        """Get PostgreSQL user."""
        return os.getenv("POSTGRES_USER", "postgres")

    @cached_property
    def postgres_password(self) -> str:
        """Get PostgreSQL password."""
        return os.getenv("POSTGRES_PASSWORD", "")

    @cached_property
    def postgres_pool_min(self) -> int:
        """Get PostgreSQL pool min."""
        return max(int(os.getenv("POSTGRES_POOL_MIN", "1")), 1)

    @cached_property
    def postgres_pool_max(self) -> int:
        """Get PostgreSQL pool max."""
        min_size = self.postgres_pool_min
        configured_max = int(os.getenv("POSTGRES_POOL_MAX", str(min_size + 4)))
        return max(configured_max, min_size)

    @cached_property
    def postgres_dsn(self) -> str:
        """Get PostgreSQL DSN."""
        explicit_dsn = os.getenv("POSTGRES_DSN")
        if explicit_dsn:
            if explicit_dsn.startswith("postgres://"):
                explicit_dsn = explicit_dsn.replace("postgres://", "postgresql+asyncpg://", 1)
            elif explicit_dsn.startswith("postgresql://"):
                explicit_dsn = explicit_dsn.replace("postgresql://", "postgresql+asyncpg://", 1)
            return explicit_dsn

        auth = ""
        user = self.postgres_user
        password = self.postgres_password

        if user:
            safe_user = quote_plus(user)
            if password:
                safe_password = quote_plus(password)
                auth = f"{safe_user}:{safe_password}@"
            else:
                auth = f"{safe_user}@"

        return f"postgresql+asyncpg://{auth}{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"

    # Redis Settings
    @cached_property
    def redis_host(self) -> str:
        """Get Redis host."""
        return os.getenv("REDIS_HOST", "localhost")

    @cached_property
    def redis_port(self) -> int:
        """Get Redis port."""
        return int(os.getenv("REDIS_PORT", "6379"))

    @cached_property
    def redis_db(self) -> int:
        """Get Redis database."""
        return int(os.getenv("REDIS_DB", "0"))

    @cached_property
    def redis_password(self) -> str:
        """Get Redis password."""
        return os.getenv("REDIS_PASSWORD", "")

    @cached_property
    def redis_cluster_mode(self) -> bool:
        """Get Redis cluster mode."""
        return os.getenv("REDIS_CLUSTER_MODE", "false").lower() == "true"

    # Frontend Settings
    @cached_property
    def frontend_dist(self) -> Path:
        """Get frontend dist directory."""
        raw_path = os.getenv("FRONTEND_DIST", "../frontend/dist")
        if Path(raw_path).is_absolute():
            return Path(raw_path)
        # Use the config file's directory as base for relative paths
        config_dir = Path(__file__).parent.parent  # backend directory
        return (config_dir / raw_path).resolve()

    @cached_property
    def frontend_mount_path(self) -> str:
        """Get frontend mount path."""
        prefix = os.getenv("FRONTEND_PREFIX", "/").strip()
        if not prefix:
            return "/"
        if prefix != "/" and not prefix.startswith("/"):
            prefix = f"/{prefix}"
        if prefix == "/":
            return "/"
        return prefix.rstrip("/")

    @cached_property
    def api_prefix(self) -> str:
        """Get API prefix path."""
        prefix = os.getenv("API_PREFIX", "/p/faq/apis").strip()
        if not prefix:
            return ""
        if not prefix.startswith("/"):
            prefix = f"/{prefix}"
        return prefix.rstrip("/")


settings = Settings()
