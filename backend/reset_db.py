#!/usr/bin/env python3
"""Reset database - drop all tables and recreate."""
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://ep_user:ep2005!@localhost:3009/ep_ax_faq"

def reset_database():
    """Drop all tables and reset alembic version."""
    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        # Drop all tables in correct order (respecting foreign keys)
        tables_to_drop = [
            'faq_tags',
            'question_variants',
            'faqs',
            'tags',
            'admin_users',
            'alembic_version'
        ]

        print("🗑️  Dropping all tables...")
        for table in tables_to_drop:
            try:
                conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
                print(f"   ✅ Dropped: {table}")
            except Exception as e:
                print(f"   ⚠️  {table}: {e}")

        conn.commit()
        print("\n✅ Database reset complete!")

if __name__ == "__main__":
    reset_database()
