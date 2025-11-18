"""Database initialization script."""
import asyncio
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import Base, FAQItem
from app.db.session import engine, AsyncSessionLocal

logger = logging.getLogger(__name__)


async def init_db():
    """Initialize database tables and seed data."""
    logger.info("Creating database tables...")

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    logger.info("Database tables created successfully")

    # Seed initial data
    await seed_initial_data()


async def seed_initial_data():
    """Seed initial FAQ data."""
    logger.info("Seeding initial FAQ data...")

    async with AsyncSessionLocal() as session:
        # Check if data already exists
        from sqlalchemy import select
        result = await session.execute(select(FAQItem).limit(1))
        existing = result.scalar_one_or_none()

        if existing:
            logger.info("Data already exists, skipping seed")
            return

        # Create sample FAQ items
        sample_faqs = [
            FAQItem(
                category="시스템 사용법",
                question="OfficePlus FAQ 시스템은 어떻게 사용하나요?",
                answer="OfficePlus FAQ 시스템은 업무 관련 자주 묻는 질문들을 검색하고 확인할 수 있는 시스템입니다. 상단의 검색창에 궁금한 내용을 입력하거나 카테고리별로 FAQ를 탐색할 수 있습니다.",
                tags="사용법,가이드,시작하기",
                is_active=True,
                created_by="SYSTEM"
            ),
            FAQItem(
                category="시스템 사용법",
                question="FAQ 검색은 어떻게 하나요?",
                answer="상단 검색창에 키워드를 입력하면 질문과 답변 내용에서 관련된 FAQ를 찾아드립니다. 여러 단어로 검색하시면 더 정확한 결과를 얻으실 수 있습니다.",
                tags="검색,찾기,키워드",
                is_active=True,
                created_by="SYSTEM"
            ),
            FAQItem(
                category="접근 권한",
                question="FAQ 시스템에 접근할 수 있는 사용자는 누구인가요?",
                answer="사내 모든 임직원이 FAQ 시스템에 접근하여 정보를 조회할 수 있습니다. 단, FAQ 작성 및 수정은 관리자 권한이 필요합니다.",
                tags="권한,접근,사용자",
                is_active=True,
                created_by="SYSTEM"
            ),
            FAQItem(
                category="기술 지원",
                question="시스템 오류가 발생하면 어디에 문의하나요?",
                answer="시스템 오류나 기술적인 문제가 발생하면 IT 헬프데스크(내선 1234)로 문의하시거나 시스템 관리자에게 이메일을 보내주시기 바랍니다.",
                tags="오류,문의,지원,헬프데스크",
                is_active=True,
                created_by="SYSTEM"
            ),
            FAQItem(
                category="데이터 관리",
                question="FAQ 데이터는 얼마나 자주 업데이트되나요?",
                answer="FAQ 데이터는 실시간으로 업데이트됩니다. 새로운 질문이나 정책 변경사항이 있을 때마다 관리자가 즉시 반영합니다.",
                tags="업데이트,데이터,관리",
                is_active=True,
                created_by="SYSTEM"
            ),
        ]

        session.add_all(sample_faqs)
        await session.commit()

        logger.info(f"Seeded {len(sample_faqs)} FAQ items")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(init_db())