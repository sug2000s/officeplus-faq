"""Application configuration."""
import os
import sys
from pathlib import Path
from typing import Optional
from urllib.parse import quote_plus

from dotenv import load_dotenv


class Settings:
    """Application settings with environment-specific loading."""

    def __init__(self, environment: Optional[str] = None):
        """Initialize settings with environment configuration.

        Args:
            environment: Explicit environment name. If None, reads from APP_ENV.
        """
        # 1. Load base .env file
        self._load_base_env()

        # 2. Determine environment (explicit > env var > None)
        app_env = environment or os.getenv('APP_ENV')
        self._environment = app_env
        self._explicit_environment = environment is not None

        # 3. Load environment-specific .env file
        self._load_environment_specific()

    def _load_base_env(self):
        """Load base .env file."""
        project_root = Path(__file__).parent.parent
        default_env = project_root / ".env"

        if default_env.exists():
            load_dotenv(default_env)
            if os.getenv("DEBUG_ENV"):
                print("✅ Loaded default .env file", file=sys.stderr)
        else:
            print(f"⚠️ Default .env file not found: {default_env}", file=sys.stderr)

    def _load_environment_specific(self):
        """Load environment-specific .env file."""
        if not self._environment:
            return

        project_root = Path(__file__).parent.parent
        env_file = project_root / f".env.{self._environment}"

        if env_file.exists():
            load_dotenv(env_file, override=True)
            if os.getenv("DEBUG_ENV"):
                print(f"✅ Loaded environment: {self._environment}", file=sys.stderr)
        else:
            print(f"⚠️ Environment file not found: {env_file}", file=sys.stderr)

    @property
    def environment(self) -> str:
        """Get current environment."""
        return self._environment or "production"

    @property
    def log_level(self) -> str:
        """Get log level."""
        return os.getenv("LOG_LEVEL", "INFO").upper()

    # API Settings
    @property
    def api_host(self) -> str:
        """Get API host."""
        return os.getenv("API_HOST", "0.0.0.0")

    @property
    def api_port(self) -> int:
        """Get API port."""
        return int(os.getenv("API_PORT", "8000"))

    @property
    def api_reload(self) -> bool:
        """Get API reload setting."""
        return os.getenv("API_RELOAD", "false").lower() == "true"

    # PostgreSQL Settings
    @property
    def postgres_host(self) -> str:
        """Get PostgreSQL host."""
        return os.getenv("POSTGRES_HOST", "localhost")

    @property
    def postgres_port(self) -> int:
        """Get PostgreSQL port."""
        return int(os.getenv("POSTGRES_PORT", "5432"))

    @property
    def postgres_db(self) -> str:
        """Get PostgreSQL database."""
        return os.getenv("POSTGRES_DB", "postgres")

    @property
    def postgres_user(self) -> str:
        """Get PostgreSQL user."""
        return os.getenv("POSTGRES_USER", "postgres")

    @property
    def postgres_password(self) -> str:
        """Get PostgreSQL password."""
        return os.getenv("POSTGRES_PASSWORD", "")

    @property
    def postgres_pool_min(self) -> int:
        """Get PostgreSQL pool min."""
        return max(int(os.getenv("POSTGRES_POOL_MIN", "1")), 1)

    @property
    def postgres_pool_max(self) -> int:
        """Get PostgreSQL pool max."""
        min_size = self.postgres_pool_min
        configured_max = int(os.getenv("POSTGRES_POOL_MAX", str(min_size + 4)))
        return max(configured_max, min_size)

    @property
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
    @property
    def redis_host(self) -> str:
        """Get Redis host."""
        return os.getenv("REDIS_HOST", "localhost")

    @property
    def redis_port(self) -> int:
        """Get Redis port."""
        return int(os.getenv("REDIS_PORT", "6379"))

    @property
    def redis_db(self) -> int:
        """Get Redis database."""
        return int(os.getenv("REDIS_DB", "0"))

    @property
    def redis_password(self) -> str:
        """Get Redis password."""
        return os.getenv("REDIS_PASSWORD", "")

    @property
    def redis_cluster_mode(self) -> bool:
        """Get Redis cluster mode."""
        return os.getenv("REDIS_CLUSTER_MODE", "false").lower() == "true"

    # Frontend Settings
    @property
    def frontend_dist(self) -> Path:
        """Get frontend dist directory."""
        raw_path = os.getenv("FRONTEND_DIST", "../frontend/dist")
        if Path(raw_path).is_absolute():
            return Path(raw_path)
        # Use the config file's directory as base for relative paths
        config_dir = Path(__file__).parent.parent  # backend directory
        return (config_dir / raw_path).resolve()

    @property
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

    @property
    def api_prefix(self) -> str:
        """Get API prefix path."""
        prefix = os.getenv("API_PREFIX", "/p/faq/apis").strip()
        if not prefix:
            return ""
        if not prefix.startswith("/"):
            prefix = f"/{prefix}"
        return prefix.rstrip("/")


# Global settings instance
settings = Settings()