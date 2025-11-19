"""Routers for the new FastAPI backend service."""
from datetime import datetime
import json
import os
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import text, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.future import select

from app.models.user import UserModel
from app.models.database import Tag, FAQ, QuestionVariant, FaqTag
from app.core.redis import redis_connection_pool as redis_pool
from app.utils.auth import is_valid
from app.utils.middleware import get_user_info_from_request
from app.config import settings
from app.db.session import get_db
from app.api.schemas import (
    TagCreate, TagUpdate, TagResponse,
    FaqCreate, FaqUpdate, FaqListResponse, FaqDetailResponse,
    QuestionVariantCreate, QuestionVariantResponse,
    PaginatedResponse,
)

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


# ==================== Tag CRUD Endpoints ====================

@router.get("/tags", response_model=List[TagResponse])
async def list_tags(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: AsyncSession = Depends(get_db),
) -> List[Tag]:
    """List all tags."""
    query = select(Tag).order_by(Tag.display_order, Tag.name)
    if is_active is not None:
        query = query.where(Tag.is_active == is_active)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/tags/{tag_id}", response_model=TagResponse)
async def get_tag(
    tag_id: int,
    db: AsyncSession = Depends(get_db),
) -> Tag:
    """Get a single tag by ID."""
    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    tag = result.scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag


@router.post("/tags", response_model=TagResponse, status_code=201)
async def create_tag(
    tag_data: TagCreate,
    db: AsyncSession = Depends(get_db),
) -> Tag:
    """Create a new tag."""
    # Check for duplicate name
    existing = await db.execute(select(Tag).where(Tag.name == tag_data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Tag name already exists")

    tag = Tag(**tag_data.model_dump())
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    return tag


@router.put("/tags/{tag_id}", response_model=TagResponse)
async def update_tag(
    tag_id: int,
    tag_data: TagUpdate,
    db: AsyncSession = Depends(get_db),
) -> Tag:
    """Update a tag."""
    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    tag = result.scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    # Check for duplicate name if updating
    if tag_data.name and tag_data.name != tag.name:
        existing = await db.execute(select(Tag).where(Tag.name == tag_data.name))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Tag name already exists")

    update_data = tag_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tag, key, value)

    await db.commit()
    await db.refresh(tag)
    return tag


@router.delete("/tags/{tag_id}")
async def delete_tag(
    tag_id: int,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Delete a tag."""
    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    tag = result.scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    await db.delete(tag)
    await db.commit()
    return {"success": True, "message": f"Tag {tag_id} deleted"}


# ==================== FAQ CRUD Endpoints ====================

@router.get("/faqs", response_model=PaginatedResponse)
async def list_faqs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search in question and answer"),
    tag_ids: Optional[str] = Query(None, description="Filter by tag IDs (comma-separated)"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """List FAQs with pagination and filtering."""
    # Base query with eager loading
    query = select(FAQ).options(selectinload(FAQ.tags))
    count_query = select(func.count(FAQ.id))

    # Apply filters
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                FAQ.question.ilike(search_pattern),
                FAQ.answer.ilike(search_pattern),
            )
        )
        count_query = count_query.where(
            or_(
                FAQ.question.ilike(search_pattern),
                FAQ.answer.ilike(search_pattern),
            )
        )

    if tag_ids:
        # Parse comma-separated tag IDs
        tag_id_list = [int(tid.strip()) for tid in tag_ids.split(',') if tid.strip().isdigit()]
        if tag_id_list:
            query = query.join(FaqTag).where(FaqTag.tag_id.in_(tag_id_list))
            count_query = count_query.join(FaqTag).where(FaqTag.tag_id.in_(tag_id_list))

    if is_active is not None:
        query = query.where(FAQ.is_active == is_active)
        count_query = count_query.where(FAQ.is_active == is_active)

    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.order_by(FAQ.updated_at.desc()).offset(offset).limit(page_size)

    result = await db.execute(query)
    items = result.scalars().unique().all()

    return {
        "items": [FaqListResponse.model_validate(item) for item in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if total > 0 else 1,
    }


@router.get("/faqs/{faq_id}", response_model=FaqDetailResponse)
async def get_faq(
    faq_id: int,
    db: AsyncSession = Depends(get_db),
) -> FAQ:
    """Get a single FAQ with all related data."""
    result = await db.execute(
        select(FAQ)
        .options(selectinload(FAQ.tags), selectinload(FAQ.question_variants))
        .where(FAQ.id == faq_id)
    )
    faq = result.scalar_one_or_none()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return faq


@router.post("/faqs", response_model=FaqDetailResponse, status_code=201)
async def create_faq(
    faq_data: FaqCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> FAQ:
    """Create a new FAQ."""
    # Get user info
    user_info = get_user_info_from_request(request)
    user_id = getattr(user_info, "emp_no", None) if user_info else None

    # Create FAQ
    faq_dict = faq_data.model_dump(exclude={"tag_ids", "new_tag_names", "question_variants"})
    faq_dict["created_by"] = user_id
    faq_dict["updated_by"] = user_id

    faq = FAQ(**faq_dict)
    db.add(faq)
    await db.flush()

    # Create new tags and collect their IDs
    new_tag_ids = []
    if faq_data.new_tag_names:
        for tag_name in faq_data.new_tag_names:
            # Check if tag already exists
            existing_result = await db.execute(
                select(Tag).where(Tag.name == tag_name)
            )
            existing_tag = existing_result.scalar_one_or_none()
            if existing_tag:
                new_tag_ids.append(existing_tag.id)
            else:
                # Create new tag
                new_tag = Tag(name=tag_name)
                db.add(new_tag)
                await db.flush()
                new_tag_ids.append(new_tag.id)

    # Add existing tags
    all_tag_ids = list(faq_data.tag_ids or []) + new_tag_ids
    for tag_id in all_tag_ids:
        tag_result = await db.execute(select(Tag).where(Tag.id == tag_id))
        if tag_result.scalar_one_or_none():
            faq_tag = FaqTag(faq_id=faq.id, tag_id=tag_id)
            db.add(faq_tag)

    # Add question variants
    if faq_data.question_variants:
        for variant in faq_data.question_variants:
            qv = QuestionVariant(faq_id=faq.id, **variant.model_dump())
            db.add(qv)
        faq.question_count = len(faq_data.question_variants)

    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(FAQ)
        .options(selectinload(FAQ.tags), selectinload(FAQ.question_variants))
        .where(FAQ.id == faq.id)
    )
    return result.scalar_one()


@router.put("/faqs/{faq_id}", response_model=FaqDetailResponse)
async def update_faq(
    faq_id: int,
    faq_data: FaqUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> FAQ:
    """Update a FAQ."""
    result = await db.execute(
        select(FAQ)
        .options(selectinload(FAQ.tags), selectinload(FAQ.question_variants))
        .where(FAQ.id == faq_id)
    )
    faq = result.scalar_one_or_none()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")

    # Get user info
    user_info = get_user_info_from_request(request)
    user_id = getattr(user_info, "emp_no", None) if user_info else None

    # Update basic fields
    update_data = faq_data.model_dump(exclude_unset=True, exclude={"tag_ids", "new_tag_names"})
    for key, value in update_data.items():
        setattr(faq, key, value)
    faq.updated_by = user_id

    # Update tags if provided
    if faq_data.tag_ids is not None or faq_data.new_tag_names:
        # Create new tags and collect their IDs
        new_tag_ids = []
        if faq_data.new_tag_names:
            for tag_name in faq_data.new_tag_names:
                # Check if tag already exists
                existing_result = await db.execute(
                    select(Tag).where(Tag.name == tag_name)
                )
                existing_tag = existing_result.scalar_one_or_none()
                if existing_tag:
                    new_tag_ids.append(existing_tag.id)
                else:
                    # Create new tag
                    new_tag = Tag(name=tag_name)
                    db.add(new_tag)
                    await db.flush()
                    new_tag_ids.append(new_tag.id)

        # Remove existing tags
        await db.execute(
            text("DELETE FROM faq_tags WHERE faq_id = :faq_id"),
            {"faq_id": faq_id}
        )
        # Add all tags (existing + new)
        all_tag_ids = list(faq_data.tag_ids or []) + new_tag_ids
        for tag_id in all_tag_ids:
            tag_result = await db.execute(select(Tag).where(Tag.id == tag_id))
            if tag_result.scalar_one_or_none():
                faq_tag = FaqTag(faq_id=faq.id, tag_id=tag_id)
                db.add(faq_tag)

    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(FAQ)
        .options(selectinload(FAQ.tags), selectinload(FAQ.question_variants))
        .where(FAQ.id == faq_id)
    )
    return result.scalar_one()


@router.delete("/faqs/{faq_id}")
async def delete_faq(
    faq_id: int,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Delete a FAQ."""
    result = await db.execute(select(FAQ).where(FAQ.id == faq_id))
    faq = result.scalar_one_or_none()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")

    await db.delete(faq)
    await db.commit()
    return {"success": True, "message": f"FAQ {faq_id} deleted"}


# ==================== Question Variant Endpoints ====================

@router.get("/faqs/{faq_id}/variants", response_model=List[QuestionVariantResponse])
async def list_variants(
    faq_id: int,
    db: AsyncSession = Depends(get_db),
) -> List[QuestionVariant]:
    """List all question variants for a FAQ."""
    # Check FAQ exists
    faq_result = await db.execute(select(FAQ).where(FAQ.id == faq_id))
    if not faq_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="FAQ not found")

    result = await db.execute(
        select(QuestionVariant)
        .where(QuestionVariant.faq_id == faq_id)
        .order_by(QuestionVariant.is_representative.desc(), QuestionVariant.created_at)
    )
    return result.scalars().all()


@router.post("/faqs/{faq_id}/variants", response_model=QuestionVariantResponse, status_code=201)
async def create_variant(
    faq_id: int,
    variant_data: QuestionVariantCreate,
    db: AsyncSession = Depends(get_db),
) -> QuestionVariant:
    """Add a question variant to a FAQ."""
    # Check FAQ exists
    faq_result = await db.execute(select(FAQ).where(FAQ.id == faq_id))
    faq = faq_result.scalar_one_or_none()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")

    variant = QuestionVariant(faq_id=faq_id, **variant_data.model_dump())
    db.add(variant)

    # Update question count
    faq.question_count += 1

    await db.commit()
    await db.refresh(variant)
    return variant


@router.delete("/variants/{variant_id}")
async def delete_variant(
    variant_id: int,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Delete a question variant."""
    result = await db.execute(select(QuestionVariant).where(QuestionVariant.id == variant_id))
    variant = result.scalar_one_or_none()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")

    # Update question count
    faq_result = await db.execute(select(FAQ).where(FAQ.id == variant.faq_id))
    faq = faq_result.scalar_one_or_none()
    if faq:
        faq.question_count = max(0, faq.question_count - 1)

    await db.delete(variant)
    await db.commit()
    return {"success": True, "message": f"Variant {variant_id} deleted"}


# ==================== Statistics Endpoints ====================

@router.get("/stats/overview")
async def get_stats_overview(
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Get overview statistics for the dashboard."""
    # Count FAQs
    faq_count = await db.execute(select(func.count(FAQ.id)))
    total_faqs = faq_count.scalar()

    # Count active FAQs
    active_faq_count = await db.execute(
        select(func.count(FAQ.id)).where(FAQ.is_active == True)
    )
    active_faqs = active_faq_count.scalar()

    # Count tags
    tag_count = await db.execute(select(func.count(Tag.id)))
    total_tags = tag_count.scalar()

    # Count variants
    variant_count = await db.execute(select(func.count(QuestionVariant.id)))
    total_variants = variant_count.scalar()

    return {
        "total_faqs": total_faqs,
        "active_faqs": active_faqs,
        "total_tags": total_tags,
        "total_variants": total_variants,
    }
