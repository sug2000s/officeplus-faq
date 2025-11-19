# OfficePlus FAQ System

OfficePlus FAQ 시스템은 FastAPI 백엔드와 React 프론트엔드로 구성된 FAQ 관리 및 조회 시스템입니다.

## 프로젝트 구조

```
officeplus-faq/
├── backend/                # 백엔드 (FastAPI)
│   ├── app/
│   │   ├── api/           # API 라우트
│   │   │   ├── routes.py  # 모든 API 엔드포인트
│   │   │   └── schemas.py # Pydantic 스키마
│   │   ├── core/          # 코어 기능
│   │   │   └── redis.py   # Redis 연결/세션
│   │   ├── db/            # 데이터베이스
│   │   │   └── session.py # DB 세션 관리
│   │   ├── models/        # 데이터 모델
│   │   │   ├── database.py # SQLAlchemy 모델
│   │   │   └── user.py    # 사용자 모델
│   │   ├── utils/         # 유틸리티
│   │   │   ├── middleware.py # 미들웨어
│   │   │   └── auth.py    # 인증
│   │   ├── config.py      # 설정
│   │   └── main.py        # FastAPI 앱 진입점
│   ├── alembic/           # 데이터베이스 마이그레이션
│   ├── docs/              # 데이터 파일 (docs.csv)
│   ├── requirements.txt   # Python 의존성
│   ├── .env              # 환경 변수
│   ├── setup.sh          # 설정 스크립트
│   └── run.sh            # 실행 스크립트
│
├── frontend/              # 프론트엔드 (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   │   ├── common/   # 공통 컴포넌트 (Button, Modal, Pagination 등)
│   │   │   └── layout/   # 레이아웃 (Header, Sidebar, MainLayout)
│   │   ├── pages/         # 페이지 컴포넌트
│   │   │   ├── faqs/     # FAQ 관련 페이지
│   │   │   └── tags/     # 태그 관련 페이지
│   │   ├── lib/           # 라이브러리 (API 클라이언트)
│   │   ├── App.tsx        # 앱 진입점
│   │   └── main.tsx       # React 진입점
│   ├── package.json      # npm 의존성
│   └── vite.config.ts    # Vite 설정
│
├── Dockerfile            # Docker 이미지 빌드
└── README.md
```

## 빠른 시작

### 1. 환경 설정

```bash
cd backend
cp .env.example .env
# .env 파일을 열어서 데이터베이스 정보를 수정하세요
```

### 2. 백엔드 설정 및 실행

```bash
cd backend

# 자동 설정 (가상환경 생성 + 의존성 설치)
./setup.sh

# 가상환경 활성화
source venv/bin/activate

# 데이터베이스 스키마 생성
PYTHONPATH=$(pwd) alembic upgrade head

# FAQ 데이터 임포트 (선택사항)
PYTHONPATH=$(pwd) python import_csv.py

# 서버 실행
./run.sh
```

### 3. 프론트엔드 빌드

```bash
cd frontend
npm install
npm run build
```

### 4. 접속

- **프론트엔드**: http://localhost:8000/
- **API 문서 (Swagger)**: http://localhost:8000/docs
- **API 문서 (ReDoc)**: http://localhost:8000/redoc

## 기술 스택

### Backend
- **FastAPI** - Python async 웹 프레임워크
- **PostgreSQL** - 관계형 데이터베이스 (asyncpg)
- **Redis** - 세션 관리 (Cluster/단일 모드 지원)
- **SQLAlchemy** - ORM (Async)
- **Pydantic** - 데이터 검증
- **Alembic** - 데이터베이스 마이그레이션

### Frontend
- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **React Router** - 라우팅
- **Axios** - HTTP 클라이언트

## API 엔드포인트

모든 API는 `/p/faq/apis` 프리픽스를 사용합니다 (설정 가능).

### 시스템
- `GET /` - 서비스 정보
- `GET /health` - 헬스 체크
- `GET /db/status` - 데이터베이스 상태

### FAQ
- `GET /faqs` - FAQ 목록 조회 (페이지네이션, 검색, 태그 필터)
- `GET /faqs/{id}` - FAQ 상세 조회 (태그, 질문 변형 포함)
- `POST /faqs` - FAQ 생성
- `PUT /faqs/{id}` - FAQ 수정
- `DELETE /faqs/{id}` - FAQ 삭제

### 태그
- `GET /tags` - 태그 목록 조회
- `GET /tags/{id}` - 태그 상세 조회
- `POST /tags` - 태그 생성
- `PUT /tags/{id}` - 태그 수정
- `DELETE /tags/{id}` - 태그 삭제

### 질문 변형
- `GET /faqs/{id}/variants` - FAQ의 질문 변형 목록
- `POST /faqs/{id}/variants` - 질문 변형 추가
- `DELETE /variants/{id}` - 질문 변형 삭제

### 통계
- `GET /stats/overview` - 대시보드 통계

### 세션
- `GET /session/whoami` - 현재 세션 정보
- `GET /redis/sessions` - Redis 세션 목록

## 데이터베이스 스키마

### faqs
FAQ 항목 테이블
- `id`: 기본키
- `question`: 질문
- `answer`: 답변 내용
- `usage_frequency`: 사용 빈도
- `question_count`: 질문 변형 개수
- `is_active`: 활성화 여부
- `created_by`, `updated_by`: 작성자/수정자
- `created_at`, `updated_at`: 타임스탬프

### tags
태그 테이블
- `id`: 기본키
- `name`: 태그명 (unique)
- `description`: 설명
- `color`: UI 표시 색상
- `display_order`: 표시 순서
- `is_active`: 활성화 여부

### faq_tags
FAQ-태그 연결 테이블 (다대다)
- `faq_id`: FAQ ID (FK)
- `tag_id`: 태그 ID (FK)

### question_variants
질문 변형 테이블
- `id`: 기본키
- `faq_id`: FAQ ID (FK)
- `question_text`: 질문 텍스트
- `is_representative`: 대표 질문 여부

### admin_users
관리자 계정 테이블
- `id`: 기본키
- `username`: 사용자명 (unique)
- `email`: 이메일 (unique)
- `hashed_password`: 해시된 비밀번호
- `role`: 역할 (super_admin, admin, viewer)
- `is_active`: 활성화 여부

## Docker 실행

```bash
# 이미지 빌드
docker build -t officeplus-faq .

# 컨테이너 실행
docker run --env-file backend/.env -p 8000:8000 officeplus-faq
docker run -p 8000:8000 officeplus-faq
```

## 환경 변수

주요 환경 변수 (`backend/.env`):

```bash
# 앱 환경
APP_ENV=local                    # local/production

# 데이터베이스
POSTGRES_HOST=localhost
POSTGRES_PORT=3009
POSTGRES_DB=ep_ax_agent
POSTGRES_USER=ep_user
POSTGRES_PASSWORD=your_password
POSTGRES_POOL_MIN=2
POSTGRES_POOL_MAX=10

# API
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=true
API_PREFIX=/p/faq/apis

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_CLUSTER_MODE=false

# 프론트엔드
FRONTEND_DIST=../frontend/dist
FRONTEND_PREFIX=/
```

## 개발 모드

### 백엔드 개발
```bash
cd backend
source venv/bin/activate
./run.sh
# 또는
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 프론트엔드 개발
```bash
cd frontend
npm run dev
```
프론트엔드 개발 서버: http://localhost:5173

Vite 설정에서 `/api` 요청은 `http://localhost:8000`으로 프록시됩니다.

## 데이터베이스 관리

```bash
cd backend
source venv/bin/activate

# 마이그레이션 적용 (테이블 생성)
PYTHONPATH=$(pwd) alembic upgrade head

# 새 마이그레이션 생성
alembic revision --autogenerate -m "description"

# 마이그레이션 히스토리 확인
alembic history

# CSV에서 FAQ 데이터 임포트
PYTHONPATH=$(pwd) python import_csv.py
```

### 데이터베이스 완전 초기화

데이터를 완전히 리셋하고 다시 임포트하려면 다음 순서로 실행하세요:

```bash
cd backend
source venv/bin/activate

# 1. 테이블 삭제
PYTHONPATH=$(pwd) python reset_db.py

# 2. 스키마 재생성 (필수! reset_db 후 반드시 실행)
PYTHONPATH=$(pwd) alembic upgrade head

# 3. 데이터 임포트
PYTHONPATH=$(pwd) python import_csv.py
```

> ⚠️ **주의**: `reset_db.py`는 테이블만 삭제합니다. 반드시 `alembic upgrade head`로 스키마를 재생성한 후 `import_csv.py`를 실행해야 합니다.

## 라이선스

내부용 프로젝트
