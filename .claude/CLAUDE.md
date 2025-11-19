# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Server
```bash
./run.sh                                      # Start dev server (uvicorn with reload)
python app/main.py                            # Alternative start
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Database Management
```bash
# Reset database (drops all tables)
PYTHONPATH=$(pwd) python reset_db.py

# Import FAQ data from CSV
PYTHONPATH=$(pwd) python import_csv.py

# Migrations
alembic upgrade head                          # Apply migrations
alembic revision --autogenerate -m "desc"     # Create new migration
alembic history                               # View migration history
```

### Setup
```bash
./setup.sh                                    # Initial setup (venv, deps, .env)
```

## Architecture

### Application Structure
```
app/
├── main.py          # FastAPI entry point with lifespan management
├── config.py        # Settings via environment variables
├── api/routes.py    # API endpoint definitions
├── core/redis.py    # Redis session manager
├── db/session.py    # SQLAlchemy async session
├── models/          # SQLAlchemy ORM models
└── utils/           # Auth and middleware
```

### Request Flow
```
Request → CORS → SessionMiddleware → Router (/p/faq/apis) → Handler → Response
```

### Database Schema
- **intents** - FAQ content with intent_id, question, answer
- **question_variants** - Alternative question phrasings (FK → intents)
- **tags** - Classification tags
- **intent_tags** - Many-to-many (intents ↔ tags)
- **admin_users** - Admin accounts

All foreign keys use `CASCADE` on delete.

### Authentication
- **Local (APP_ENV=local):** No auth required, uses default LOCAL_DEV user
- **Production:** Requires AX cookie validated against Redis session

Session data format in Redis (key: `AX:{cookie}`):
```json
{"id": "emp_no", "email": "...", "dept": "...", "corp": "..."}
```

### Key Patterns

**Database Access:**
```python
from app.db.session import get_db

@router.get("/endpoint")
async def handler(db: AsyncSession = Depends(get_db)):
    result = await db.execute(query)
```

**Configuration:**
```python
from app.config import settings
dsn = settings.postgres_dsn
```

**User Context:**
```python
from app.utils.middleware import get_user_info_from_request
user = get_user_info_from_request(request)
```

## Environment Configuration

Key variables in `.env`:
- `APP_ENV` - local/production
- `POSTGRES_HOST/PORT/DB/USER/PASSWORD` - Database connection
- `REDIS_HOST/PORT/PASSWORD` - Session store
- `API_PREFIX` - API path prefix (default: /p/faq/apis)

PostgreSQL: `localhost:3009/ep_ax_agent`
Redis: `localhost:6379`

## Data Import

CSV file: `docs/docs.csv`
Import creates: 119 tags, 1,290 intents, 13,949 question variants
