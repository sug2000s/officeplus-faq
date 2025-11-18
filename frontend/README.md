# ATi Frontend (React + Vite)

## 개발 실행

```bash
cd fastapi_service/front
npm install
npm run dev
```

## 프로덕션 빌드

```bash
npm run build
```

빌드 결과물은 `fastapi_service/front/dist` 에 생성되며 FastAPI 서버의 `FRONTEND_DIST` 환경 변수를 통해 서빙 경로를 지정할 수 있습니다.

## 환경 변수

Vite에서는 `.env` 파일 또는 `VITE_` prefix 환경 변수를 사용합니다.

```bash
VITE_API_BASE=/api
```

기본 proxy 설정(`vite.config.ts`)은 `/api` 요청을 `http://localhost:8000` 으로 전달하도록 되어 있습니다.
