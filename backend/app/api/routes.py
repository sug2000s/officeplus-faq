"""Routers for the new FastAPI backend service."""
from datetime import datetime
import json
import os
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import UserModel
from app.core.redis import redis_connection_pool as redis_pool
from app.utils.auth import is_valid
from app.utils.middleware import get_user_info_from_request
from app.config import settings
from app.db.session import get_db

router = APIRouter(tags=["API"])


@router.get("/")
async def root() -> Dict[str, Any]:
    """Base endpoint to verify the new service is running."""
    return {
        "service": "ATi FastAPI Service",
        "status": "running",
        "environment": settings.environment,
        "redis_cluster_mode": settings.redis_cluster_mode,
    }


@router.get("/health")
async def health() -> Dict[str, Any]:
    """Simple health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": settings.environment,
    }


@router.get("/db/status")
async def database_status(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Validate Postgres connectivity and report metadata."""
    result = await db.execute(text("SELECT current_database(), current_timestamp"))
    database_name, current_time = result.first()
    return {
        "database": database_name,
        "current_time": current_time.isoformat(),
        "dsn": mask_dsn(settings.postgres_dsn),
    }


@router.get("/session/whoami")
async def session_whoami(request: Request) -> Dict[str, Any]:
    """Return the current session information, mirroring the legacy behavior."""
    user_info = get_user_info_from_request(request)
    session_id = None

    # 미들웨어에서 검증되지 않은 경우 직접 처리
    if not user_info:
        app_env = os.getenv("APP_ENV", os.getenv("ENVIRONMENT", None))
        ax_cookie = request.cookies.get("AX")

        if app_env in ("local", "default", None) and not ax_cookie:
            # 로컬 기본 사용자
            user_info = UserModel()
            user_info.emp_no = "LOCAL_DEV"
            user_info.emp_nm = "local@lgcns.com"
            user_info.dept_cd = "99999"
            user_info.dept_nm = "99999"
            user_info.pctr_cd = "LG00"
            session_id = "local_session"
        else:
            if not ax_cookie:
                raise HTTPException(status_code=401, detail="AX cookie not found")

            session_id = f"AX:{ax_cookie}"
            user_info = await is_valid(session_id)

            if user_info is None:
                raise HTTPException(status_code=401, detail="Invalid or expired session")
    else:
        ax_cookie = request.cookies.get("AX")
        session_id = f"AX:{ax_cookie}" if ax_cookie else "validated_session"

    return {
        "success": True,
        "user_info": serialize_user(user_info),
        "session_id": session_id,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/redis/sessions")
async def list_sessions(
    pattern: str = Query("AX:*", description="Redis key pattern to search for."),
    limit: int = Query(50, ge=1, le=500, description="Maximum number of sessions to return."),
) -> Dict[str, Any]:
    """List active Redis sessions using the shared connection pool."""
    redis_conn = redis_pool.get_connection()
    if redis_conn is None:
        raise HTTPException(status_code=503, detail="Redis connection is not available")

    sessions: List[Dict[str, Any]] = []
    scan_callable = getattr(redis_conn, "scan", None)

    if callable(scan_callable):
        cursor = 0
        while True:
            cursor, keys = scan_callable(cursor=cursor, match=pattern, count=min(limit * 2, 1000))
            for key in keys:
                key_str = key.decode("utf-8") if isinstance(key, bytes) else key
                sessions.append(read_session(redis_conn, key_str))
                if len(sessions) >= limit:
                    break
            if cursor == 0 or len(sessions) >= limit:
                break
    else:
        keys = redis_conn.keys(pattern)
        for raw_key in keys[:limit]:
            key_str = raw_key.decode("utf-8") if isinstance(raw_key, bytes) else raw_key
            sessions.append(read_session(redis_conn, key_str))

    return {
        "success": True,
        "pattern": pattern,
        "count": len(sessions),
        "sessions": sessions,
    }


@router.get("/redis/sessions/{raw_key}")
async def get_session(raw_key: str) -> Dict[str, Any]:
    """Retrieve a single Redis session."""
    redis_conn = redis_pool.get_connection()
    if redis_conn is None:
        raise HTTPException(status_code=503, detail="Redis connection is not available")

    key = normalize_session_key(raw_key)
    if not redis_conn.exists(key):
        raise HTTPException(status_code=404, detail=f"Session {key} not found")

    return {
        "success": True,
        "session": read_session(redis_conn, key),
    }


def mask_dsn(dsn: str) -> str:
    """Mask credentials in a DSN string for safe logging/exposure."""
    if "@" not in dsn:
        return dsn

    prefix, suffix = dsn.split("@", 1)
    if "://" not in prefix:
        return f"***@{suffix}"

    scheme, credentials = prefix.split("://", 1)
    if ":" in credentials:
        user = credentials.split(":", 1)[0]
    else:
        user = credentials

    return f"{scheme}://{user}:***@{suffix}"


def read_session(redis_conn, key: str) -> Dict[str, Any]:
    """Fetch TTL and payload for a session key."""
    ttl = redis_conn.ttl(key)
    raw_value = redis_conn.get(key)

    decoded_value: Optional[Any]
    if raw_value is None:
        decoded_value = None
    elif isinstance(raw_value, bytes):
        decoded_value = raw_value.decode("utf-8")
    else:
        decoded_value = raw_value

    parsed_value: Any
    if isinstance(decoded_value, str):
        try:
            parsed_value = json.loads(decoded_value)
        except json.JSONDecodeError:
            parsed_value = decoded_value
    else:
        parsed_value = decoded_value

    return {
        "key": key,
        "ttl": ttl,
        "value": parsed_value,
    }


def serialize_user(user: UserModel) -> Dict[str, Any]:
    """Serialize a user model into a JSON friendly dict."""
    return {
        "id": getattr(user, "emp_no", None),
        "name": getattr(user, "emp_nm", None),
        "dept": getattr(user, "dept_cd", None),
        "corp": getattr(user, "pctr_cd", None),
    }


def normalize_session_key(session_key: str) -> str:
    """Ensure the session key uses the AX prefix expected by Redis."""
    return session_key if session_key.startswith("AX:") else f"AX:{session_key}"
