# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend Server
```bash
cd backend
./run.sh                                      # Start dev server (uvicorn with reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Alternative with explicit PYTHONPATH
PYTHONPATH=$(pwd) python -m uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install                                   # Install dependencies
npm run dev                                   # Start dev server (port 5173)
npm run build                                 # Production build to dist/
```

### Database Management
```bash
cd backend
source venv/bin/activate

# Initialize database (creates tables)
PYTHONPATH=$(pwd) python app/db/init_db.py

# Reset database (drops all tables, recreates)
PYTHONPATH=$(pwd) python reset_db.py

# Import FAQ data from CSV
PYTHONPATH=$(pwd) python import_csv.py

# Migrations
alembic upgrade head                          # Apply migrations
alembic revision --autogenerate -m "desc"     # Create new migration
```

### Initial Setup
```bash
cd backend
./setup.sh                                    # Creates venv, installs deps, copies .env
```

## Architecture

### Project Structure
```
officeplus-faq/
├── backend/                   # FastAPI backend
│   ├── app/
│   │   ├── main.py           # FastAPI entry point with lifespan
│   │   ├── config.py         # Settings via environment variables
│   │   ├── api/
│   │   │   ├── routes.py     # All API endpoints
│   │   │   └── schemas.py    # Pydantic request/response models
│   │   ├── core/redis.py     # Redis connection pool (cluster/single)
│   │   ├── db/session.py     # SQLAlchemy async session factory
│   │   ├── models/
│   │   │   ├── database.py   # SQLAlchemy ORM models (FAQ, Tag, etc.)
│   │   │   └── user.py       # User model for session data
│   │   └── utils/
│   │       ├── middleware.py # Request user context extraction
│   │       └── auth.py       # Redis session validation
│   ├── alembic/              # Database migrations
│   ├── docs/docs.csv         # FAQ import data
│   └── requirements.txt
└── frontend/                  # React + TypeScript + Vite
    ├── src/
    │   ├── components/       # React components
    │   ├── pages/            # Page components
    │   └── lib/              # API client (axios)
    └── vite.config.ts        # Vite config with /api proxy
```

### Request Flow
```
Request → CORS → SessionMiddleware → Router (/p/faq/apis) → Handler → Response
```

### Database Schema
- **faqs** - FAQ items with question, answer, usage_frequency, question_count
- **question_variants** - Alternative question phrasings (FK → faqs)
- **tags** - Classification tags with name, color, display_order
- **faq_tags** - Many-to-many (faqs ↔ tags)
- **admin_users** - Admin accounts with role-based access

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
user_id = getattr(user, "emp_no", None)
```

**Eager Loading Relations:**
```python
from sqlalchemy.orm import selectinload

query = select(FAQ).options(
    selectinload(FAQ.tags),
    selectinload(FAQ.question_variants)
)
```

## API Endpoints

All endpoints are prefixed with `/p/faq/apis` (configured via `API_PREFIX`).

### System
- `GET /` - Service info
- `GET /health` - Health check
- `GET /db/status` - Database status
- `GET /session/whoami` - Current session info
- `GET /redis/sessions` - List Redis sessions

### FAQs
- `GET /faqs` - List with pagination, search, tag filter
- `GET /faqs/{id}` - Detail with tags and variants
- `POST /faqs` - Create (supports inline tag creation)
- `PUT /faqs/{id}` - Update
- `DELETE /faqs/{id}` - Delete

### Tags
- `GET /tags` - List all tags
- `GET /tags/{id}` - Get tag
- `POST /tags` - Create tag
- `PUT /tags/{id}` - Update tag
- `DELETE /tags/{id}` - Delete tag

### Question Variants
- `GET /faqs/{id}/variants` - List variants for FAQ
- `POST /faqs/{id}/variants` - Add variant
- `DELETE /variants/{id}` - Delete variant

### Statistics
- `GET /stats/overview` - Dashboard stats

## Environment Configuration

Backend environment (`.env` in `backend/`):
- `APP_ENV` - local/production
- `POSTGRES_HOST/PORT/DB/USER/PASSWORD` - Database connection
- `REDIS_HOST/PORT/PASSWORD` - Session store
- `API_PREFIX` - API path prefix (default: /p/faq/apis)
- `FRONTEND_DIST` - Path to frontend build (default: ../frontend/dist)

Frontend environment:
- `VITE_API_BASE` - API base path (default: /api)

Default ports:
- Backend: `localhost:8000`
- Frontend dev: `localhost:5173`
- PostgreSQL: `localhost:3009`
- Redis: `localhost:6379`

## Data Import

CSV source: `backend/docs/docs.csv`
Import creates tags, FAQs, and question variants from structured CSV data.