"""API routes."""
from fastapi import APIRouter

from app.config import settings
from .routes import router as base_router
from .faq import router as faq_router

# Combine all routers with API prefix
router = APIRouter(prefix=settings.api_prefix)
router.include_router(base_router)
router.include_router(faq_router)

__all__ = ["router"]
