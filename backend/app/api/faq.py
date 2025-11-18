
"""FAQ API endpoints."""
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import select, or_, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import FAQItem, FAQFeedback, SearchLog
from app.db.session import get_db
from app.utils.middleware import get_user_info_from_request

router = APIRouter(prefix="/faq", tags=["FAQ"])


# Pydantic models for request/response
class FAQItemResponse(BaseModel):
    id: int
    category: str
    question: str
    answer: str
    tags: Optional[str] = None
    is_active: bool
    view_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FAQCreateRequest(BaseModel):
    category: str = Field(..., min_length=1, max_length=100)
    question: str = Field(..., min_length=1)
    answer: str = Field(..., min_length=1)
    tags: Optional[str] = None
    is_active: bool = True


class FAQUpdateRequest(BaseModel):
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    question: Optional[str] = Field(None, min_length=1)
    answer: Optional[str] = Field(None, min_length=1)
    tags: Optional[str] = None
    is_active: Optional[bool] = None


class FAQFeedbackRequest(BaseModel):
    faq_id: int
    is_helpful: bool
    comment: Optional[str] = None


@router.get("/", response_model=List[FAQItemResponse])
async def list_faqs(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in question and answer"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return"),
    db: AsyncSession = Depends(get_db),
) -> List[FAQItemResponse]:
    """Get list of FAQ items with optional filtering."""
    query = select(FAQItem).where(FAQItem.is_active == True)

    if category:
        query = query.where(FAQItem.category == category)

    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                FAQItem.question.ilike(search_term),
                FAQItem.answer.ilike(search_term),
                FAQItem.tags.ilike(search_term),
            )
        )

    query = query.order_by(FAQItem.view_count.desc(), FAQItem.created_at.desc())
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    faqs = result.scalars().all()

    return [FAQItemResponse.model_validate(faq) for faq in faqs]


@router.get("/categories")
async def list_categories(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Get list of all FAQ categories with count."""
    query = select(
        FAQItem.category,
        func.count(FAQItem.id).label("count")
    ).where(FAQItem.is_active == True).group_by(FAQItem.category)

    result = await db.execute(query)
    categories = result.all()

    return {
        "success": True,
        "categories": [
            {"name": cat, "count": count}
            for cat, count in categories
        ]
    }


@router.get("/{faq_id}", response_model=FAQItemResponse)
async def get_faq(
    faq_id: int,
    db: AsyncSession = Depends(get_db),
) -> FAQItemResponse:
    """Get a specific FAQ item by ID."""
    query = select(FAQItem).where(FAQItem.id == faq_id)
    result = await db.execute(query)
    faq = result.scalar_one_or_none()

    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")

    # Increment view count
    await db.execute(
        update(FAQItem)
        .where(FAQItem.id == faq_id)
        .values(view_count=FAQItem.view_count + 1)
    )
    await db.commit()

    return FAQItemResponse.model_validate(faq)


@router.post("/", response_model=FAQItemResponse)
async def create_faq(
    faq_data: FAQCreateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> FAQItemResponse:
    """Create a new FAQ item."""
    user_info = get_user_info_from_request(request)
    user_id = getattr(user_info, "emp_no", None) if user_info else "ANONYMOUS"

    new_faq = FAQItem(
        category=faq_data.category,
        question=faq_data.question,
        answer=faq_data.answer,
        tags=faq_data.tags,
        is_active=faq_data.is_active,
        created_by=user_id,
        updated_by=user_id,
    )

    db.add(new_faq)
    await db.commit()
    await db.refresh(new_faq)

    return FAQItemResponse.model_validate(new_faq)


@router.put("/{faq_id}", response_model=FAQItemResponse)
async def update_faq(
    faq_id: int,
    faq_data: FAQUpdateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> FAQItemResponse:
    """Update an existing FAQ item."""
    query = select(FAQItem).where(FAQItem.id == faq_id)
    result = await db.execute(query)
    faq = result.scalar_one_or_none()

    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")

    user_info = get_user_info_from_request(request)
    user_id = getattr(user_info, "emp_no", None) if user_info else "ANONYMOUS"

    # Update fields if provided
    update_data = faq_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(faq, field, value)

    faq.updated_by = user_id
    faq.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(faq)

    return FAQItemResponse.model_validate(faq)


@router.delete("/{faq_id}")
async def delete_faq(
    faq_id: int,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Soft delete an FAQ item (set is_active to False)."""
    query = select(FAQItem).where(FAQItem.id == faq_id)
    result = await db.execute(query)
    faq = result.scalar_one_or_none()

    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")

    faq.is_active = False
    await db.commit()

    return {"success": True, "message": "FAQ deleted successfully"}


@router.post("/feedback")
async def submit_feedback(
    feedback_data: FAQFeedbackRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Submit feedback for an FAQ item."""
    user_info = get_user_info_from_request(request)
    user_id = getattr(user_info, "emp_no", None) if user_info else None

    feedback = FAQFeedback(
        faq_id=feedback_data.faq_id,
        user_id=user_id,
        is_helpful=feedback_data.is_helpful,
        comment=feedback_data.comment,
    )

    db.add(feedback)
    await db.commit()

    return {"success": True, "message": "Feedback submitted successfully"}


@router.post("/search")
async def log_search(
    search_query: str = Query(..., min_length=1),
    result_count: int = Query(0, ge=0),
    clicked_faq_id: Optional[int] = None,
    request: Request = None,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Log a search query."""
    user_info = get_user_info_from_request(request)
    user_id = getattr(user_info, "emp_no", None) if user_info else None

    log_entry = SearchLog(
        user_id=user_id,
        search_query=search_query,
        result_count=result_count,
        clicked_faq_id=clicked_faq_id,
    )

    db.add(log_entry)
    await db.commit()

    return {"success": True, "message": "Search logged successfully"}