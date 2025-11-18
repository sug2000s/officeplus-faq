"""Database models for the FAQ service."""
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, Integer, String, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class FAQItem(Base):
    """FAQ 항목 모델"""
    __tablename__ = "faq_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category = Column(String(100), nullable=False, index=True, comment="FAQ 카테고리")
    question = Column(Text, nullable=False, comment="질문 내용")
    answer = Column(Text, nullable=False, comment="답변 내용")
    tags = Column(String(500), nullable=True, comment="검색 태그 (쉼표로 구분)")
    is_active = Column(Boolean, default=True, nullable=False, comment="활성화 여부")
    view_count = Column(Integer, default=0, nullable=False, comment="조회수")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment="생성일시")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, comment="수정일시")
    created_by = Column(String(50), nullable=True, comment="작성자 사번")
    updated_by = Column(String(50), nullable=True, comment="수정자 사번")

    def __repr__(self):
        return f"<FAQItem(id={self.id}, category={self.category}, question={self.question[:30]}...)>"


class FAQFeedback(Base):
    """FAQ 피드백 모델"""
    __tablename__ = "faq_feedback"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    faq_id = Column(Integer, nullable=False, index=True, comment="FAQ 항목 ID")
    user_id = Column(String(50), nullable=True, comment="사용자 사번")
    is_helpful = Column(Boolean, nullable=False, comment="도움 여부 (True: 도움됨, False: 도움안됨)")
    comment = Column(Text, nullable=True, comment="추가 의견")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment="생성일시")

    def __repr__(self):
        return f"<FAQFeedback(id={self.id}, faq_id={self.faq_id}, is_helpful={self.is_helpful})>"


class SearchLog(Base):
    """검색 로그 모델"""
    __tablename__ = "search_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), nullable=True, comment="사용자 사번")
    search_query = Column(String(500), nullable=False, comment="검색어")
    result_count = Column(Integer, default=0, nullable=False, comment="검색 결과 수")
    clicked_faq_id = Column(Integer, nullable=True, comment="클릭한 FAQ ID")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment="생성일시")

    def __repr__(self):
        return f"<SearchLog(id={self.id}, query={self.search_query}, results={self.result_count})>"