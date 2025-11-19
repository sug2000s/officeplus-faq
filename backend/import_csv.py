#!/usr/bin/env python3
"""Import FAQ data from CSV file to database."""
import sys
import pandas as pd
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.database import Base, Tag, FaqTag, FAQ, QuestionVariant

# Database configuration
DATABASE_URL = "postgresql://ep_user:ep2005!@localhost:3009/ep_ax_faq"

# CSV file path
CSV_FILE_PATH = "docs/docs.csv"


def clean_text(text):
    """Clean text field."""
    if pd.isna(text) or text is None:
        return None
    return str(text).strip()


def parse_csv_file():
    """Parse CSV file and return DataFrame."""
    print(f"Reading CSV file: {CSV_FILE_PATH}")

    try:
        # Read CSV with proper encoding
        df = pd.read_csv(CSV_FILE_PATH, encoding='utf-8-sig')
        print(f"CSV loaded: {len(df)} rows, {len(df.columns)} columns")

        # Show column names
        print(f"\nCSV Columns:")
        for i, col in enumerate(df.columns, 1):
            print(f"   {i}. {col}")

        return df
    except Exception as e:
        print(f"Error reading CSV: {e}")
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

        print(f"\nStarting import process...")

        # Step 1: Clear existing data
        print("\n1. Clearing existing data...")
        deleted_faq_tags = session.query(FaqTag).delete()
        deleted_variants = session.query(QuestionVariant).delete()
        deleted_faqs = session.query(FAQ).delete()
        deleted_tags = session.query(Tag).delete()
        session.commit()
        print(f"   Deleted: {deleted_variants} question variants, {deleted_faqs} FAQs, {deleted_tags} tags, {deleted_faq_tags} faq_tags")

        # Step 2: Extract unique tags (from 의도그룹)
        print("\n2. Creating Tags...")
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
                print(f"   Created: {tag.name} (ID: {tag.id})")

        session.commit()
        print(f"   Total Tags created: {len(tags)}")

        # Step 3: Import FAQs and QuestionVariants
        print("\n3. Importing FAQs and Question Variants...")

        faqs_created = 0
        variants_created = 0
        errors = []

        for idx, row in df.iterrows():
            try:
                # Get values from row by position
                group_name = clean_text(row[3])  # 의도그룹
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
                if not display_q or not answer:
                    errors.append(f"Row {idx+2}: Missing essential fields (question or answer)")
                    continue

                # Create FAQ
                is_active = usage_status == '사용' if usage_status else True

                faq = FAQ(
                    question=display_q,
                    answer=answer,
                    usage_frequency=int(usage_freq) if usage_freq else 0,
                    question_count=int(q_count) if q_count else 0,
                    is_active=is_active,
                    created_by=created_by,
                    updated_by=updated_by,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                session.add(faq)
                session.flush()  # Get the ID
                faqs_created += 1

                # Create FaqTag relationship (optional - tag can be None)
                if group_name and group_name in tags:
                    faq_tag = FaqTag(
                        faq_id=faq.id,
                        tag_id=tags[group_name],
                        created_at=datetime.utcnow()
                    )
                    session.add(faq_tag)

                # Create QuestionVariants
                if questions:
                    question_list = [q.strip() for q in questions.split(',')]
                    for question_text in question_list:
                        if question_text:
                            variant = QuestionVariant(
                                faq_id=faq.id,
                                question_text=question_text,
                                is_representative=(question_text == rep_question),
                                created_at=datetime.utcnow()
                            )
                            session.add(variant)
                            variants_created += 1

                # Commit every 100 rows
                if (idx + 1) % 100 == 0:
                    session.commit()
                    print(f"   Progress: {idx + 1}/{len(df)} rows processed...")

            except Exception as e:
                errors.append(f"Row {idx+2}: {str(e)}")
                continue

        # Final commit
        session.commit()

        print(f"\nImport completed!")
        print(f"   FAQs created: {faqs_created}")
        print(f"   Question Variants created: {variants_created}")

        if errors:
            print(f"\nErrors ({len(errors)}):")
            for error in errors[:10]:  # Show first 10 errors
                print(f"   - {error}")
            if len(errors) > 10:
                print(f"   ... and {len(errors) - 10} more errors")

        # Step 4: Verify import
        print("\n4. Verifying import...")
        total_tags = session.query(Tag).count()
        total_faqs = session.query(FAQ).count()
        total_variants = session.query(QuestionVariant).count()
        total_faq_tags = session.query(FaqTag).count()

        print(f"   Tags: {total_tags}")
        print(f"   FAQs: {total_faqs}")
        print(f"   Question Variants: {total_variants}")
        print(f"   FAQ-Tag Relations: {total_faq_tags}")

        # Show sample data
        print("\nSample Tags:")
        tag_list = session.query(Tag).order_by(Tag.display_order).limit(5).all()
        for t in tag_list:
            faq_count = session.query(FaqTag).filter_by(tag_id=t.id).count()
            print(f"   - {t.name}: {faq_count} FAQs")

        print("\nSample FAQs (Top 5 by usage):")
        faqs = session.query(FAQ).order_by(FAQ.usage_frequency.desc()).limit(5).all()
        for f in faqs:
            variant_count = session.query(QuestionVariant).filter_by(faq_id=f.id).count()
            print(f"   - {f.question[:50]}... ({f.usage_frequency} views, {variant_count} variants)")

    except Exception as e:
        session.rollback()
        print(f"\nImport failed: {e}")
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
    print("  Import Complete!")
    print("=" * 60)
