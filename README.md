# OfficePlus FAQ System

OfficePlus FAQ 시스템은 FastAPI 백엔드와 React 프론트엔드로 구성된 FAQ 관리 및 조회 시스템입니다.

## 📁 프로젝트 구조

```
officeplus-faq/
├── backend/                # 백엔드 (FastAPI)
│   ├── app/
│   │   ├── api/           # API 라우트
│   │   │   ├── routes.py  # 기본 라우트 (헬스체크, 세션)
│   │   │   └── faq.py     # FAQ API
│   │   ├── core/          # 코어 기능
│   │   │   └── redis.py   # Redis 연결/세션
│   │   ├── db/            # 데이터베이스
│   │   │   ├── session.py # DB 세션 관리
│   │   │   └── init_db.py # DB 초기화 스크립트
│   │   ├── models/        # 데이터 모델
│   │   │   ├── database.py # SQLAlchemy 모델
│   │   │   └── user.py    # 사용자 모델
│   │   ├── utils/         # 유틸리티
│   │   │   ├── middleware.py # 미들웨어
│   │   │   └── auth.py    # 인증
│   │   ├── config.py      # 설정
│   │   └── main.py        # FastAPI 앱 진입점
│   ├── requirements.txt   # Python 의존성
│   ├── .env              # 환경 변수
│   ├── .env.example      # 환경 변수 예제
│   ├── setup.sh          # 설정 스크립트
│   └── run.sh            # 실행 스크립트
│
├── frontend/              # 프론트엔드 (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── lib/           # 라이브러리 (API 클라이언트)
│   │   ├── App.tsx        # 앱 진입점
│   │   └── main.tsx       # React 진입점
│   ├── dist/             # 빌드 결과물
│   ├── package.json      # npm 의존성
│   └── vite.config.ts    # Vite 설정
│
├── Dockerfile            # Docker 이미지 빌드
└── README.md
```

## 🚀 빠른 시작

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

# 데이터베이스 초기화
source venv/bin/activate
PYTHONPATH=$(pwd) python app/db/init_db.py

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

## 🛠 기술 스택

### Backend
- **FastAPI** - Python async 웹 프레임워크
- **PostgreSQL** - 관계형 데이터베이스 (asyncpg)
- **Redis** - 세션 관리 및 대화 이력 (Cluster/단일 모드 지원)
- **SQLAlchemy** - ORM (Async)
- **Pydantic** - 데이터 검증

📖 **[Redis 세션 관리 통합 가이드](backend/REDIS_SESSION_INTEGRATION.md)** - ATi-Backend의 세션 관리 시스템 통합 문서

### Frontend
- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **React Router** - 라우팅
- **Axios** - HTTP 클라이언트

## 📡 API 엔드포인트

### 시스템
- `GET /api/` - 서비스 정보
- `GET /api/health` - 헬스 체크
- `GET /api/db/status` - 데이터베이스 상태

### FAQ
- `GET /api/faq/` - FAQ 목록 조회 (검색, 카테고리 필터)
- `GET /api/faq/categories` - 카테고리 목록
- `GET /api/faq/{id}` - FAQ 상세 조회
- `POST /api/faq/` - FAQ 생성
- `PUT /api/faq/{id}` - FAQ 수정
- `DELETE /api/faq/{id}` - FAQ 삭제 (soft delete)
- `POST /api/faq/feedback` - 피드백 제출

### 세션 (옵션)
- `GET /api/session/whoami` - 현재 세션 정보
- `GET /api/redis/sessions` - Redis 세션 목록

## 🐳 Docker 실행

```bash
# 이미지 빌드
docker build -t officeplus-faq .

# 컨테이너 실행
docker run --env-file backend/.env -p 8000:8000 officeplus-faq
```

## 💾 데이터베이스 스키마

### faq_items
FAQ 항목 테이블
- `id`: 기본키
- `category`: 카테고리
- `question`: 질문
- `answer`: 답변
- `tags`: 태그 (쉼표 구분)
- `is_active`: 활성화 여부
- `view_count`: 조회수
- `created_at`, `updated_at`: 타임스탬프
- `created_by`, `updated_by`: 작성자/수정자

### faq_feedback
피드백 테이블
- `id`: 기본키
- `faq_id`: FAQ ID (FK)
- `user_id`: 사용자 ID
- `is_helpful`: 도움 여부
- `comment`: 의견
- `created_at`: 생성 시간

### search_logs
검색 로그 테이블
- `id`: 기본키
- `user_id`: 사용자 ID
- `search_query`: 검색어
- `result_count`: 결과 수
- `clicked_faq_id`: 클릭한 FAQ ID
- `created_at`: 생성 시간

## ⚙️ 환경 변수

주요 환경 변수 (`backend/.env`):

```bash
# 데이터베이스
POSTGRES_HOST=localhost
POSTGRES_PORT=3009
POSTGRES_DB=ep_ax_agent
POSTGRES_USER=ep_user
POSTGRES_PASSWORD=ep2005!
POSTGRES_POOL_MIN=2
POSTGRES_POOL_MAX=10

# API
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=true

# Redis (옵션)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# 프론트엔드
FRONTEND_DIST=../frontend/dist
FRONTEND_PREFIX=/
```

## 🔧 개발 모드

### 백엔드 개발
```bash
cd backend
source venv/bin/activate
export PYTHONPATH=$(pwd)
uvicorn app.main:app --reload
```

### 프론트엔드 개발
```bash
cd frontend
npm run dev
```
프론트엔드 개발 서버: http://localhost:5173

## 📝 라이선스

내부용 프로젝트
