"""Pydantic schemas for API request/response validation."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# ==================== Tag Schemas ====================

class TagBase(BaseModel):
    """Base schema for Tag."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    display_order: int = 0
    is_active: bool = True


class TagCreate(TagBase):
    """Schema for creating a Tag."""
    pass


class TagUpdate(BaseModel):
    """Schema for updating a Tag."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class TagResponse(TagBase):
    """Schema for Tag response."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== Question Variant Schemas ====================

class QuestionVariantBase(BaseModel):
    """Base schema for QuestionVariant."""
    question_text: str = Field(..., min_length=1, max_length=500)
    is_representative: bool = False


class QuestionVariantCreate(QuestionVariantBase):
    """Schema for creating a QuestionVariant."""
    pass


class QuestionVariantResponse(QuestionVariantBase):
    """Schema for QuestionVariant response."""
    id: int
    intent_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== Intent Schemas ====================

class IntentBase(BaseModel):
    """Base schema for Intent."""
    intent_id: str = Field(..., min_length=1, max_length=50)
    intent_type: Optional[str] = Field(None, max_length=50)
    intent_name: str = Field(..., min_length=1, max_length=200)
    representative_question: str = Field(..., min_length=1)
    display_question: str = Field(..., min_length=1, max_length=500)
    answer: str = Field(..., min_length=1)
    context: Optional[str] = Field(None, max_length=500)
    is_active: bool = True


class IntentCreate(IntentBase):
    """Schema for creating an Intent."""
    tag_ids: Optional[List[int]] = []
    question_variants: Optional[List[QuestionVariantCreate]] = []


class IntentUpdate(BaseModel):
    """Schema for updating an Intent."""
    intent_type: Optional[str] = Field(None, max_length=50)
    intent_name: Optional[str] = Field(None, min_length=1, max_length=200)
    representative_question: Optional[str] = None
    display_question: Optional[str] = Field(None, max_length=500)
    answer: Optional[str] = None
    context: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None
    tag_ids: Optional[List[int]] = None


class IntentListResponse(BaseModel):
    """Schema for Intent list response (summary)."""
    id: int
    intent_id: str
    intent_type: Optional[str]
    intent_name: str
    display_question: str
    usage_frequency: int
    question_count: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    tags: List[TagResponse] = []

    class Config:
        from_attributes = True


class IntentDetailResponse(IntentListResponse):
    """Schema for Intent detail response (full)."""
    representative_question: str
    answer: str
    context: Optional[str]
    created_by: Optional[str]
    updated_by: Optional[str]
    question_variants: List[QuestionVariantResponse] = []

    class Config:
        from_attributes = True


# ==================== Pagination Schemas ====================

class PaginationParams(BaseModel):
    """Pagination parameters."""
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


class PaginatedResponse(BaseModel):
    """Paginated response wrapper."""
    items: List
    total: int
    page: int
    page_size: int
    total_pages: int
