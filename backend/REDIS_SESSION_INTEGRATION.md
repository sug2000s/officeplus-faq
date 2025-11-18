# Redis 세션 관리 통합 가이드

OfficePlus FAQ 시스템의 Redis 기반 세션 관리 시스템 문서입니다.

## 📋 개요

ATi-Backend의 Redis 세션 관리 시스템을 OfficePlus FAQ 백엔드에 완전히 통합했습니다.

### 주요 기능
- ✅ AX 쿠키 기반 세션 검증
- ✅ Redis Cluster 및 단일 모드 지원
- ✅ 세션 재시도 및 자동 갱신 감지
- ✅ 로컬 개발 모드 (쿠키 없이 동작)
- ✅ Redis Cluster MovedError 자동 처리
- ✅ 대화 이력 관리 (ConversationMessage)

---

## 🏗️ 아키텍처

### 1. Redis 연결 관리 (`app/core/redis.py`)

#### RedisConfig
환경 변수에서 Redis 설정을 로드합니다.

```python
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
REDIS_CLUSTER_MODE=false  # true로 설정하면 Cluster 모드
```

#### RedisConnectionPool
Redis 연결을 관리하고 Cluster/단일 모드를 자동으로 처리합니다.

```python
from app.core.redis import redis_connection_pool

# 연결 가져오기
redis_conn = redis_connection_pool.get_connection()

# 연결 테스트
is_connected = redis_connection_pool.test_connection()

# 연결 갱신 (Cluster MovedError 시)
redis_connection_pool.refresh_connection()
```

#### RedisSessionManager
대화 이력을 Redis에 저장하고 관리합니다.

```python
from app.core.redis import RedisSessionManager, ConversationMessage

# 초기화
session_manager = RedisSessionManager()
await session_manager.startup()

# 대화 이력 조회
messages = await session_manager.get_conversation_history("session_id", limit=50)

# 메시지 추가
msg = ConversationMessage(role="user", content="안녕하세요")
await session_manager.add_message("session_id", msg)

# 세션 삭제
await session_manager.clear_session("session_id")
```

---

### 2. 세션 미들웨어 (`app/utils/middleware.py`)

모든 요청을 가로채서 세션을 검증하고 사용자 정보를 추출합니다.

#### 동작 방식

1. **로컬 환경 (APP_ENV=local)**
   - AX 쿠키가 있으면 Redis 조회 시도
   - 없거나 실패 시 기본 사용자 정보 (LOCAL_DEV) 사용
   - 인증 없이 모든 API 사용 가능

2. **프로덕션 환경**
   - AX 쿠키 필수
   - Redis에서 세션 검증
   - 세션 만료 시 401 에러 반환

#### 제외 경로 (세션 체크 안 함)
```python
excluded_paths = [
    "/",
    "/health",
    "/api/",
    "/api/health",
    "/api/db/status",
    "/api/session/whoami",
    "/api/redis/sessions",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/favicon.ico",
    "/static"
]

# FAQ GET 요청도 세션 체크 제외 (읽기 전용)
```

#### 세션 재시도 로직

세션 만료 시 최대 3회 재시도하며, SSO 서버의 세션 갱신을 자동으로 감지합니다.

```python
# 재시도 간 대기 시간: 0.5초, 1초, 1.5초
# AX 쿠키 갱신 감지 및 자동 재검증
```

---

### 3. 인증 유틸리티 (`app/utils/auth.py`)

Redis에서 세션 데이터를 조회하고 UserModel로 변환합니다.

#### is_valid(auth_key: str) → UserModel | None

```python
from app.utils.auth import is_valid

# 세션 검증
user_info = await is_valid("AX:cookie_value_here")

if user_info:
    print(f"사용자: {user_info.emp_nm} ({user_info.emp_no})")
    print(f"부서: {user_info.dept_nm}")
    print(f"법인: {user_info.pctr_cd}")
```

#### Redis 필드 매핑

| Redis 필드 | UserModel 필드 | 설명 |
|-----------|---------------|------|
| id | emp_no | 사번 |
| email | emp_nm | 이메일 (@ 앞부분만) |
| dept | dept_cd, dept_nm | 부서 코드/이름 |
| corp | pctr_cd | 법인 코드 |
| type | - | 사용자 타입 |
| status | - | 상태 |
| locale | - | 언어 설정 |
| loginTime | - | 로그인 시간 |
| lastActivity | - | 마지막 활동 시간 |

#### Redis Cluster MovedError 처리

```python
# 자동으로 최대 3회 재시도
# 연결 풀 갱신 및 점진적 대기 (0.5초, 1초, 1.5초)
```

---

### 4. 사용자 모델 (`app/models/user.py`)

```python
class UserModel(BaseModel):
    # 실제 Redis 필드 (기본 필드)
    emp_no: str = "LOCAL_DEV"  # Redis: id
    emp_nm: str = "local@lgcns.com"  # Redis: email
    dept_cd: str = "99999"  # Redis: dept
    dept_nm: str = "99999"  # Redis: dept
    pctr_cd: str = "LG00"  # Redis: corp

    # 추가 필드 (하위 호환성)
    dept_all_nm: str = ""
    title_nm: str = ""
    jc_nm: str = ""
    dept_l1_nm: str = ""
    dept_l2_nm: str = ""
    dept_l3_nm: str = ""
    dept_l4_nm: str = ""
    working_day_flag: bool = True
```

---

## 🚀 사용 방법

### API 핸들러에서 사용자 정보 가져오기

```python
from fastapi import Request
from app.utils.middleware import get_user_info_from_request

@router.post("/api/faq/")
async def create_faq(request: Request, faq_data: FAQCreate):
    # 미들웨어가 검증한 사용자 정보 가져오기
    user_info = get_user_info_from_request(request)

    if user_info:
        print(f"작성자: {user_info.emp_nm} ({user_info.emp_no})")

        # FAQ 생성
        new_faq = FAQItem(
            category=faq_data.category,
            question=faq_data.question,
            answer=faq_data.answer,
            created_by=user_info.emp_no,
            updated_by=user_info.emp_no
        )
        # ... DB 저장

    return {"success": True, "faq": new_faq}
```

### 세션 검증 여부 확인

```python
from app.utils.middleware import is_session_validated

@router.get("/api/protected")
async def protected_route(request: Request):
    if not is_session_validated(request):
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_info = get_user_info_from_request(request)
    return {"user": user_info.emp_nm}
```

---

## 🧪 테스트

### 로컬 개발 환경

```bash
# .env 파일 확인
APP_ENV=local

# 서버 실행
cd backend
source venv/bin/activate
export PYTHONPATH=$(pwd)
uvicorn app.main:app --reload

# API 테스트 (쿠키 없이)
curl -X POST http://localhost:8000/api/faq/ \
  -H "Content-Type: application/json" \
  -d '{
    "category": "일반",
    "question": "테스트 질문",
    "answer": "테스트 답변",
    "tags": "test"
  }'

# 응답: created_by="LOCAL_DEV"
```

### 프로덕션 환경

```bash
# .env 파일 수정
APP_ENV=production

# AX 쿠키와 함께 요청
curl -X POST http://localhost:8000/api/faq/ \
  -H "Content-Type: application/json" \
  -H "Cookie: AX=your_session_cookie_here" \
  -d '{
    "category": "일반",
    "question": "테스트 질문",
    "answer": "테스트 답변"
  }'

# 유효한 세션: created_by="실제사번"
# 무효한 세션: 401 Unauthorized
```

### 세션 정보 확인

```bash
# whoami 엔드포인트
curl http://localhost:8000/api/session/whoami

# 로컬 환경 응답:
{
  "user": {
    "emp_no": "LOCAL_DEV",
    "emp_nm": "local@lgcns.com",
    "dept_cd": "99999",
    "dept_nm": "개발팀",
    "pctr_cd": "LG00"
  }
}
```

---

## 🔧 환경 변수

### Redis 설정

```bash
# Redis 서버
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# Cluster 모드 (true/false)
REDIS_CLUSTER_MODE=false

# 세션 TTL (초)
SESSION_TTL=3600
```

### 애플리케이션 환경

```bash
# 개발 환경: local, default, null
# 프로덕션 환경: production, prod
APP_ENV=local
ENVIRONMENT=local

# 로그 레벨
LOG_LEVEL=INFO
```

---

## 🐛 문제 해결

### 1. Redis 연결 실패

```bash
# 로그 확인
❌ Redis Session Manager 연결 실패: Connection refused

# 해결방법
1. Redis 서버가 실행 중인지 확인
   redis-cli ping  # 응답: PONG

2. .env에서 REDIS_HOST와 REDIS_PORT 확인

3. Redis 비밀번호 설정 확인 (있는 경우)
```

### 2. 세션 검증 실패 (프로덕션)

```bash
# 로그 확인
⚠️  세션 검증 실패 - 재시도 후에도 유효하지 않은 세션: AX:xxxxx...

# 해결방법
1. AX 쿠키가 유효한지 확인
2. Redis에서 세션 데이터 확인
   redis-cli
   > GET "AX:cookie_value"

3. 세션 TTL 확인
   > TTL "AX:cookie_value"
```

### 3. Redis Cluster MovedError

```bash
# 로그 확인
⚠️  Redis Cluster MovedError 감지 (시도 1/3): MOVED 1234 127.0.0.1:6380

# 자동 처리됨
✅ Redis 연결 갱신 완료
✅ 세션 재검증 성공
```

### 4. 로컬 환경에서 실제 Redis 세션 테스트

```bash
# .env 설정
APP_ENV=local

# Redis에 테스트 세션 추가
redis-cli
> SET "AX:test123" '{"id":"12345","email":"test@lgcns.com","dept":"TEST_DEPT","corp":"LG01"}'
> EXPIRE "AX:test123" 86400

# 브라우저/curl에서 AX 쿠키 설정
curl http://localhost:8000/api/session/whoami \
  -H "Cookie: AX=test123"

# 응답: 실제 Redis 데이터 (테스트 사용자)
```

---

## 📊 성능 최적화

### 1. Redis 연결 풀

```python
MAX_CONNECTION_POOL = 20  # 최대 연결 수

# 연결 풀 재사용으로 성능 향상
# 각 요청마다 새 연결 생성하지 않음
```

### 2. 세션 TTL 자동 갱신

```python
# getex 명령어 사용: GET + EXPIRE를 한 번에
redis_conn.getex(auth_key, SSO_SESSION_TIMEOUT)

# 매 요청마다 세션 TTL이 24시간으로 갱신됨
```

### 3. 대화 이력 최적화

```python
# 최대 200개 메시지만 유지 (오래된 것 자동 삭제)
redis.ltrim(session_key, 0, 199)

# 최근 50개만 조회 (성능)
messages = await get_conversation_history(session_id, limit=50)
```

---

## 🔐 보안 고려사항

### 1. 세션 키 로깅 제한

```python
# 전체 세션 키 대신 앞 8자만 로깅
logger.info(f"세션 검증: {session_id[:8]}...")
```

### 2. 필수 필드 검증

```python
# Redis 데이터 무결성 확인
required_fields = ['id', 'email']
for field in required_fields:
    if field not in user:
        return None  # 세션 거부
```

### 3. JSON 파싱 안전성

```python
try:
    user = json.loads(user_info)
except json.JSONDecodeError:
    return None  # 잘못된 데이터 거부
```

---

## 📚 참고

### 관련 파일

- `backend/app/core/redis.py` - Redis 연결 및 세션 관리
- `backend/app/utils/middleware.py` - 세션 미들웨어
- `backend/app/utils/auth.py` - 세션 검증 로직
- `backend/app/models/user.py` - 사용자 모델
- `backend/.env` - 환경 변수 설정

### ATi-Backend 원본 파일

- `/Users/ryu/ATi-Backend/src/storage/redis/connection_pool.py`
- `/Users/ryu/ATi-Backend/src/utils/middleware.py`
- `/Users/ryu/ATi-Backend/src/utils/auth_filter.py`
- `/Users/ryu/ATi-Backend/src/models/user.py`

---

## ✅ 완료된 작업

1. ✅ RedisConfig 클래스 통합 (Cluster/단일 모드 지원)
2. ✅ RedisConnectionPool 통합 (연결 관리 및 갱신)
3. ✅ RedisSessionManager 통합 (대화 이력 관리)
4. ✅ SessionMiddleware 통합 (세션 검증 및 재시도)
5. ✅ is_valid() 함수 통합 (Redis MovedError 처리)
6. ✅ UserModel 필드 매핑 업데이트
7. ✅ 로컬 개발 모드 지원 (APP_ENV=local)
8. ✅ 제외 경로 설정 (health, docs 등)
9. ✅ FAQ GET 요청 세션 체크 제외
10. ✅ 모든 imports 테스트 완료

---

**작성일**: 2025-11-17
**버전**: 1.0.0
**작성자**: Claude Code
