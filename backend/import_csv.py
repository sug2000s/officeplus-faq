#!/usr/bin/env python3
"""Import FAQ data from CSV file to database."""
import sys
import pandas as pd
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.database import Base, Tag, IntentTag, Intent, QuestionVariant

# Database configuration
DATABASE_URL = "postgresql://ep_user:ep2005!@localhost:3009/ep_ax_agent"

# CSV file path
CSV_FILE_PATH = "docs/docs.csv"

# Column mapping (Korean to English)
COLUMN_MAPPING = {
    '의도ID': 'intent_id',
    '의도유형': 'intent_type',
    '의도명': 'intent_name',
    '의도그룹': 'intent_group',
    '컨텍스트': 'context',
    '사용상태': 'usage_status',
    '총 사용빈도': 'usage_frequency',
    '질의문 갯수': 'question_count',
    '대표질의문': 'representative_question',
    'display질의문': 'display_question',
    '질의문': 'questions',
    '등록자': 'created_by',
    '수정자': 'updated_by',
    '단순응답': 'answer',
}


def clean_text(text):
    """Clean text field."""
    if pd.isna(text) or text is None:
        return None
    return str(text).strip()


def parse_csv_file():
    """Parse CSV file and return DataFrame."""
    print(f"📖 Reading CSV file: {CSV_FILE_PATH}")

    try:
        # Read CSV with proper encoding
        df = pd.read_csv(CSV_FILE_PATH, encoding='utf-8-sig')
        print(f"✅ CSV loaded: {len(df)} rows, {len(df.columns)} columns")

        # Show column names
        print(f"\n📋 CSV Columns:")
        for i, col in enumerate(df.columns, 1):
            print(f"   {i}. {col}")

        return df
    except Exception as e:
        print(f"❌ Error reading CSV: {e}")
        sys.exit(1)


def import_data():
    """Import CSV data to database."""
    # Create database engine
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Parse CSV
        df = parse_csv_file()

        print(f"\n🔄 Starting import process...")

        # Step 1: Clear existing data
        print("\n1️⃣ Clearing existing data...")
        deleted_intent_tags = session.query(IntentTag).delete()
        deleted_variants = session.query(QuestionVariant).delete()
        deleted_intents = session.query(Intent).delete()
        deleted_tags = session.query(Tag).delete()
        session.commit()
        print(f"   ✅ Deleted: {deleted_variants} question variants, {deleted_intents} intents, {deleted_tags} tags, {deleted_intent_tags} intent_tags")

        # Step 2: Extract unique tags (from 의도그룹)
        print("\n2️⃣ Creating Tags...")
        tags = {}
        unique_groups = df[df.columns[3]].unique()  # 의도그룹 column

        for idx, tag_name in enumerate(sorted(unique_groups), 1):
            if pd.notna(tag_name) and str(tag_name).strip():
                tag = Tag(
                    name=str(tag_name).strip(),
                    description=None,
                    color=None,
                    display_order=idx,
                    is_active=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                session.add(tag)
                session.flush()  # Get the ID
                tags[str(tag_name).strip()] = tag.id
                print(f"   ✅ Created: {tag.name} (ID: {tag.id})")

        session.commit()
        print(f"   📊 Total Tags created: {len(tags)}")

        # Step 3: Import Intents and QuestionVariants
        print("\n3️⃣ Importing Intents and Question Variants...")

        intents_created = 0
        variants_created = 0
        errors = []

        for idx, row in df.iterrows():
            try:
                # Get values from row by position (since column names might vary)
                intent_id = clean_text(row[0])  # 의도ID
                intent_type = clean_text(row[1])  # 의도유형
                intent_name = clean_text(row[2])  # 의도명
                group_name = clean_text(row[3])  # 의도그룹
                context = clean_text(row[4])  # 컨텍스트
                usage_status = clean_text(row[5])  # 사용상태
                usage_freq = row[6] if pd.notna(row[6]) else 0  # 총 사용빈도
                q_count = row[7] if pd.notna(row[7]) else 0  # 질의문 갯수
                rep_question = clean_text(row[8])  # 대표질의문
                display_q = clean_text(row[9])  # display질의문
                questions = clean_text(row[10])  # 질의문
                created_by = clean_text(row[11])  # 등록자
                updated_by = clean_text(row[12])  # 수정자
                answer = clean_text(row[14])  # 단순응답 (13번은 날짜 필드)

                # Skip if essential fields are missing
                if not intent_id or not intent_name or not rep_question or not answer:
                    errors.append(f"Row {idx+2}: Missing essential fields")
                    continue

                # Create Intent (without intent_group_id)
                is_active = usage_status == '사용' if usage_status else True

                intent = Intent(
                    intent_id=intent_id,
                    intent_type=intent_type,
                    intent_name=intent_name,
                    representative_question=rep_question,
                    display_question=display_q or intent_name,
                    answer=answer,
                    context=context,
                    usage_frequency=int(usage_freq) if usage_freq else 0,
                    question_count=int(q_count) if q_count else 0,
                    is_active=is_active,
                    created_by=created_by,
                    updated_by=updated_by,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                session.add(intent)
                session.flush()  # Get the ID
                intents_created += 1

                # Create IntentTag relationship (optional - tag can be None)
                if group_name and group_name in tags:
                    intent_tag = IntentTag(
                        intent_id=intent.id,
                        tag_id=tags[group_name],
                        created_at=datetime.utcnow()
                    )
                    session.add(intent_tag)

                # Create QuestionVariants
                if questions:
                    question_list = [q.strip() for q in questions.split(',')]
                    for question_text in question_list:
                        if question_text:
                            variant = QuestionVariant(
                                intent_id=intent.id,
                                question_text=question_text,
                                is_representative=(question_text == rep_question),
                                created_at=datetime.utcnow()
                            )
                            session.add(variant)
                            variants_created += 1

                # Commit every 100 rows
                if (idx + 1) % 100 == 0:
                    session.commit()
                    print(f"   📝 Progress: {idx + 1}/{len(df)} rows processed...")

            except Exception as e:
                errors.append(f"Row {idx+2}: {str(e)}")
                continue

        # Final commit
        session.commit()

        print(f"\n✅ Import completed!")
        print(f"   📊 Intents created: {intents_created}")
        print(f"   📊 Question Variants created: {variants_created}")

        if errors:
            print(f"\n⚠️  Errors ({len(errors)}):")
            for error in errors[:10]:  # Show first 10 errors
                print(f"   - {error}")
            if len(errors) > 10:
                print(f"   ... and {len(errors) - 10} more errors")

        # Step 4: Verify import
        print("\n4️⃣ Verifying import...")
        total_tags = session.query(Tag).count()
        total_intents = session.query(Intent).count()
        total_variants = session.query(QuestionVariant).count()
        total_intent_tags = session.query(IntentTag).count()

        print(f"   📊 Tags: {total_tags}")
        print(f"   📊 Intents: {total_intents}")
        print(f"   📊 Question Variants: {total_variants}")
        print(f"   📊 Intent-Tag Relations: {total_intent_tags}")

        # Show sample data
        print("\n📋 Sample Tags:")
        tag_list = session.query(Tag).order_by(Tag.display_order).limit(5).all()
        for t in tag_list:
            intent_count = session.query(IntentTag).filter_by(tag_id=t.id).count()
            print(f"   - {t.name}: {intent_count} intents")

        print("\n📋 Sample Intents (Top 5 by usage):")
        intents = session.query(Intent).order_by(Intent.usage_frequency.desc()).limit(5).all()
        for i in intents:
            variant_count = session.query(QuestionVariant).filter_by(intent_id=i.id).count()
            print(f"   - {i.display_question} ({i.usage_frequency} views, {variant_count} variants)")

    except Exception as e:
        session.rollback()
        print(f"\n❌ Import failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        session.close()
        engine.dispose()


if __name__ == "__main__":
    print("=" * 60)
    print("  FAQ CSV Import Script")
    print("=" * 60)
    import_data()
    print("\n" + "=" * 60)
    print("  ✅ Import Complete!")
    print("=" * 60)
