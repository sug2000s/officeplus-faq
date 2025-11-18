"""Database models for the FAQ service."""
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, Integer, String, Text, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class Tag(Base):
    """태그 모델 (선택적 분류)"""
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True, comment="태그명 (예: #Ucloud, #Mail)")
    description = Column(Text, nullable=True, comment="태그 설명")
    color = Column(String(7), nullable=True, comment="UI 표시 색상 (#RRGGBB)")
    display_order = Column(Integer, default=0, nullable=False, comment="표시 순서")
    is_active = Column(Boolean, default=True, nullable=False, index=True, comment="활성화 여부")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment="생성일시")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, comment="수정일시")

    # Relationships (다대다)
    intents = relationship("Intent", secondary="intent_tags", back_populates="tags")

    def __repr__(self):
        return f"<Tag(id={self.id}, name={self.name})>"


class IntentTag(Base):
    """Intent-Tag 연결 테이블 (다대다 관계)"""
    __tablename__ = "intent_tags"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    intent_id = Column(Integer, ForeignKey("intents.id", ondelete="CASCADE"), nullable=False, index=True, comment="의도 ID")
    tag_id = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), nullable=False, index=True, comment="태그 ID")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment="생성일시")

    __table_args__ = (
        UniqueConstraint('intent_id', 'tag_id', name='uq_intent_tag'),
    )

    def __repr__(self):
        return f"<IntentTag(intent_id={self.intent_id}, tag_id={self.tag_id})>"


class Intent(Base):
    """의도 (FAQ 본문) 모델"""
    __tablename__ = "intents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    intent_id = Column(String(50), nullable=False, unique=True, index=True, comment="CSV의 의도ID (예: INTacb567...)")
    intent_type = Column(String(50), nullable=True, comment="의도 유형 (예: 질의응답)")
    intent_name = Column(String(200), nullable=False, index=True, comment="의도명")
    representative_question = Column(Text, nullable=False, comment="대표 질의문")
    display_question = Column(String(500), nullable=False, comment="화면 표시용 질의문")
    answer = Column(Text, nullable=False, comment="답변 내용")
    context = Column(String(500), nullable=True, comment="컨텍스트 (추가 태그/키워드)")
    usage_frequency = Column(Integer, default=0, nullable=False, index=True, comment="사용 빈도")
    question_count = Column(Integer, default=0, nullable=False, comment="질의문 갯수")
    is_active = Column(Boolean, default=True, nullable=False, index=True, comment="활성화 여부")
    created_by = Column(String(50), nullable=True, comment="작성자")
    updated_by = Column(String(50), nullable=True, comment="수정자")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment="생성일시")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, comment="수정일시")

    # Relationships
    tags = relationship("Tag", secondary="intent_tags", back_populates="intents")
    question_variants = relationship("QuestionVariant", back_populates="intent", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Intent(id={self.id}, intent_id={self.intent_id}, name={self.intent_name})>"


class QuestionVariant(Base):
    """질문 변형 모델 (다양한 질문 표현)"""
    __tablename__ = "question_variants"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    intent_id = Column(Integer, ForeignKey("intents.id", ondelete="CASCADE"), nullable=False, index=True, comment="의도 ID")
    question_text = Column(String(500), nullable=False, index=True, comment="질문 텍스트")
    is_representative = Column(Boolean, default=False, nullable=False, comment="대표 질의문 여부")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment="생성일시")

    # Relationships
    intent = relationship("Intent", back_populates="question_variants")

    def __repr__(self):
        return f"<QuestionVariant(id={self.id}, intent_id={self.intent_id}, text={self.question_text[:30]}...)>"


class AdminUser(Base):
    """관리자 계정 모델"""
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), nullable=False, unique=True, index=True, comment="사용자명")
    email = Column(String(100), nullable=False, unique=True, comment="이메일")
    hashed_password = Column(String(255), nullable=False, comment="해시된 비밀번호")
    role = Column(String(20), default="admin", nullable=False, comment="역할 (super_admin, admin, viewer)")
    is_active = Column(Boolean, default=True, nullable=False, index=True, comment="활성화 여부")
    last_login_at = Column(DateTime, nullable=True, comment="마지막 로그인 일시")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment="생성일시")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, comment="수정일시")

    def __repr__(self):
        return f"<AdminUser(id={self.id}, username={self.username}, role={self.role})>"