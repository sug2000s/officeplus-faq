"""create faq schema with tags system

Revision ID: 66c2c105139c
Revises:
Create Date: 2025-11-18 11:18:45.440820

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '66c2c105139c'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create admin_users table
    op.create_table('admin_users',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('username', sa.String(length=50), nullable=False, comment='사용자명'),
    sa.Column('email', sa.String(length=100), nullable=False, comment='이메일'),
    sa.Column('hashed_password', sa.String(length=255), nullable=False, comment='해시된 비밀번호'),
    sa.Column('role', sa.String(length=20), nullable=False, comment='역할 (super_admin, admin, viewer)'),
    sa.Column('is_active', sa.Boolean(), nullable=False, comment='활성화 여부'),
    sa.Column('last_login_at', sa.DateTime(), nullable=True, comment='마지막 로그인 일시'),
    sa.Column('created_at', sa.DateTime(), nullable=False, comment='생성일시'),
    sa.Column('updated_at', sa.DateTime(), nullable=False, comment='수정일시'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_admin_users_id'), 'admin_users', ['id'], unique=False)
    op.create_index(op.f('ix_admin_users_is_active'), 'admin_users', ['is_active'], unique=False)
    op.create_index(op.f('ix_admin_users_username'), 'admin_users', ['username'], unique=True)

    # Create faqs table (renamed from intents)
    op.create_table('faqs',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('question', sa.String(length=500), nullable=False, comment='질문'),
    sa.Column('answer', sa.Text(), nullable=False, comment='답변 내용'),
    sa.Column('usage_frequency', sa.Integer(), nullable=False, comment='사용 빈도'),
    sa.Column('question_count', sa.Integer(), nullable=False, comment='질의문 갯수'),
    sa.Column('is_active', sa.Boolean(), nullable=False, comment='활성화 여부'),
    sa.Column('created_by', sa.String(length=50), nullable=True, comment='작성자'),
    sa.Column('updated_by', sa.String(length=50), nullable=True, comment='수정자'),
    sa.Column('created_at', sa.DateTime(), nullable=False, comment='생성일시'),
    sa.Column('updated_at', sa.DateTime(), nullable=False, comment='수정일시'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_faqs_id'), 'faqs', ['id'], unique=False)
    op.create_index(op.f('ix_faqs_question'), 'faqs', ['question'], unique=False)
    op.create_index(op.f('ix_faqs_is_active'), 'faqs', ['is_active'], unique=False)
    op.create_index(op.f('ix_faqs_usage_frequency'), 'faqs', ['usage_frequency'], unique=False)

    # Create tags table
    op.create_table('tags',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False, comment='태그명 (예: #Ucloud, #Mail)'),
    sa.Column('description', sa.Text(), nullable=True, comment='태그 설명'),
    sa.Column('color', sa.String(length=7), nullable=True, comment='UI 표시 색상 (#RRGGBB)'),
    sa.Column('display_order', sa.Integer(), nullable=False, comment='표시 순서'),
    sa.Column('is_active', sa.Boolean(), nullable=False, comment='활성화 여부'),
    sa.Column('created_at', sa.DateTime(), nullable=False, comment='생성일시'),
    sa.Column('updated_at', sa.DateTime(), nullable=False, comment='수정일시'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_tags_id'), 'tags', ['id'], unique=False)
    op.create_index(op.f('ix_tags_is_active'), 'tags', ['is_active'], unique=False)

    # Create faq_tags table (renamed from intent_tags)
    op.create_table('faq_tags',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('faq_id', sa.Integer(), nullable=False, comment='FAQ ID'),
    sa.Column('tag_id', sa.Integer(), nullable=False, comment='태그 ID'),
    sa.Column('created_at', sa.DateTime(), nullable=False, comment='생성일시'),
    sa.ForeignKeyConstraint(['faq_id'], ['faqs.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('faq_id', 'tag_id', name='uq_faq_tag')
    )
    op.create_index(op.f('ix_faq_tags_id'), 'faq_tags', ['id'], unique=False)
    op.create_index(op.f('ix_faq_tags_faq_id'), 'faq_tags', ['faq_id'], unique=False)
    op.create_index(op.f('ix_faq_tags_tag_id'), 'faq_tags', ['tag_id'], unique=False)

    # Create question_variants table
    op.create_table('question_variants',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('faq_id', sa.Integer(), nullable=False, comment='FAQ ID'),
    sa.Column('question_text', sa.String(length=500), nullable=False, comment='질문 텍스트'),
    sa.Column('is_representative', sa.Boolean(), nullable=False, comment='대표 질의문 여부'),
    sa.Column('created_at', sa.DateTime(), nullable=False, comment='생성일시'),
    sa.ForeignKeyConstraint(['faq_id'], ['faqs.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_question_variants_id'), 'question_variants', ['id'], unique=False)
    op.create_index(op.f('ix_question_variants_faq_id'), 'question_variants', ['faq_id'], unique=False)
    op.create_index(op.f('ix_question_variants_question_text'), 'question_variants', ['question_text'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_question_variants_question_text'), table_name='question_variants')
    op.drop_index(op.f('ix_question_variants_faq_id'), table_name='question_variants')
    op.drop_index(op.f('ix_question_variants_id'), table_name='question_variants')
    op.drop_table('question_variants')
    op.drop_index(op.f('ix_faq_tags_tag_id'), table_name='faq_tags')
    op.drop_index(op.f('ix_faq_tags_faq_id'), table_name='faq_tags')
    op.drop_index(op.f('ix_faq_tags_id'), table_name='faq_tags')
    op.drop_table('faq_tags')
    op.drop_index(op.f('ix_tags_is_active'), table_name='tags')
    op.drop_index(op.f('ix_tags_id'), table_name='tags')
    op.drop_table('tags')
    op.drop_index(op.f('ix_faqs_usage_frequency'), table_name='faqs')
    op.drop_index(op.f('ix_faqs_is_active'), table_name='faqs')
    op.drop_index(op.f('ix_faqs_question'), table_name='faqs')
    op.drop_index(op.f('ix_faqs_id'), table_name='faqs')
    op.drop_table('faqs')
    op.drop_index(op.f('ix_admin_users_username'), table_name='admin_users')
    op.drop_index(op.f('ix_admin_users_is_active'), table_name='admin_users')
    op.drop_index(op.f('ix_admin_users_id'), table_name='admin_users')
    op.drop_table('admin_users')
