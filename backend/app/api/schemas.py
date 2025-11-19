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
    faq_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== FAQ Schemas ====================

class FaqBase(BaseModel):
    """Base schema for FAQ."""
    question: str = Field(..., min_length=1, max_length=500)
    answer: str = Field(..., min_length=1)
    is_active: bool = True


class FaqCreate(FaqBase):
    """Schema for creating a FAQ."""
    tag_ids: Optional[List[int]] = []
    new_tag_names: Optional[List[str]] = []
    question_variants: Optional[List[QuestionVariantCreate]] = []


class FaqUpdate(BaseModel):
    """Schema for updating a FAQ."""
    question: Optional[str] = Field(None, min_length=1, max_length=500)
    answer: Optional[str] = None
    is_active: Optional[bool] = None
    tag_ids: Optional[List[int]] = None
    new_tag_names: Optional[List[str]] = None


class FaqListResponse(BaseModel):
    """Schema for FAQ list response (summary)."""
    id: int
    question: str
    usage_frequency: int
    question_count: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    tags: List[TagResponse] = []

    class Config:
        from_attributes = True


class FaqDetailResponse(FaqListResponse):
    """Schema for FAQ detail response (full)."""
    answer: str
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
