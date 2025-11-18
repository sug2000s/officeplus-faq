"""세션 관리 미들웨어"""
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import logging
import os
from datetime import datetime
from typing import Optional
import asyncio

from app.models.user import UserModel
from app.utils.auth import is_valid

logger = logging.getLogger(__name__)


class SessionMiddleware(BaseHTTPMiddleware):
    """
    세션 관리 미들웨어

    동작 방식:
    1. 로컬 환경 (APP_ENV=local): 쿠키 없이도 기본 사용자 정보로 동작
    2. 프로덕션 환경: AX 쿠키 기반 실제 세션 검증 (Redis 키: AX:{쿠키값})

    로컬 개발 시:
    - 브라우저에서 쿠키 설정 불필요
    - Postman, curl 등에서 별도 인증 헤더 불필요
    - 자동으로 'LOCAL_DEV' 사용자로 동작
    """

    def __init__(self, app, excluded_paths: list = None):
        super().__init__(app)
        # 세션 체크를 제외할 경로들
        self.excluded_paths = excluded_paths or [
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

    async def dispatch(self, request: Request, call_next):
        """미들웨어 메인 로직"""

        # 제외 경로 체크
        if request.url.path in self.excluded_paths:
            return await call_next(request)

        # 정적 파일 경로 체크
        if request.url.path.startswith("/static/") or request.url.path.startswith("/assets/"):
            return await call_next(request)

        # FAQ 관련 GET 요청은 세션 체크 제외 (읽기 전용)
        if request.method == "GET" and request.url.path.startswith("/api/faq"):
            return await call_next(request)

        try:
            # 세션 검증 및 사용자 정보 추출
            user_info = await self._validate_session(request)

            # request state에 사용자 정보 저장
            request.state.user_info = user_info
            request.state.session_validated = True

            # 다음 미들웨어/핸들러 호출
            response = await call_next(request)

            return response

        except HTTPException as e:
            # 인증 실패 시 JSON 응답 반환
            return JSONResponse(
                status_code=e.status_code,
                content={
                    "success": False,
                    "error": e.detail,
                    "timestamp": datetime.now().isoformat(),
                    "path": request.url.path
                }
            )
        except Exception as e:
            logger.error(f"세션 미들웨어 오류: {e}")
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error": "Internal server error during session validation",
                    "timestamp": datetime.now().isoformat(),
                    "path": request.url.path
                }
            )

    async def _validate_session(self, request: Request) -> UserModel:
        """세션 검증 로직 - 세션 재갱신 처리 포함"""
        app_env = os.getenv("APP_ENV", os.getenv("ENVIRONMENT", None))
        ax_cookie = request.cookies.get('AX')

        # 로컬 환경: AX cookie가 있으면 Redis 조회 시도, 없으면 기본 사용자 정보
        if app_env in ("local", "default", None):
            if ax_cookie:
                # AX cookie가 있으면 실제 사용자 정보 조회 시도
                session_id = f"AX:{ax_cookie}"

                try:
                    user_info = await self._validate_session_with_retry(session_id, request)
                    if user_info is not None:
                        logger.info(f"✅ 로컬 환경 - Redis 사용자 로드: {user_info.emp_nm} ({user_info.emp_no})")
                        return user_info
                    else:
                        logger.debug("로컬 환경 - Redis 조회 실패, 기본 사용자 사용")
                except Exception as e:
                    logger.debug(f"로컬 환경 - Redis 조회 오류: {e}")

            # AX cookie가 없거나 Redis 조회 실패 시 기본 사용자 정보 반환
            logger.info("✅ 로컬 환경 - 기본 사용자 사용: LOCAL_DEV")
            return UserModel(
                emp_no="LOCAL_DEV",
                emp_nm="local@lgcns.com",
                dept_cd="99999",
                dept_nm="개발팀",
                pctr_cd="LG00",
                dept_all_nm="",
                title_nm="개발자",
                jc_nm="",
                dept_l1_nm="",
                dept_l2_nm="",
                dept_l3_nm="",
                dept_l4_nm="",
                working_day_flag=True
            )

        # 프로덕션 환경에서는 실제 세션 검증 (AX cookie 필수)
        if not ax_cookie:
            logger.warning("AX 쿠키 없음")
            raise HTTPException(status_code=401, detail="AX cookie not found")

        # Redis 키 형식: AX:{쿠키값}
        session_id = f"AX:{ax_cookie}"

        # 세션 유효성 검사 및 유저 정보 조회 (재시도 메커니즘 포함)
        user_info = await self._validate_session_with_retry(session_id, request)

        if user_info is None:
            logger.warning(f"세션 검증 실패 - 재시도 후에도 유효하지 않은 세션: {session_id[:8]}...")
            raise HTTPException(status_code=401, detail="Invalid or expired session")

        logger.info(f"세션 검증 성공: {user_info.emp_nm} ({user_info.emp_no})")
        return user_info

    async def _validate_session_with_retry(self, session_id: str, request: Request, max_retries: int = 2) -> Optional[UserModel]:
        """세션 검증 재시도 로직 - SSO 세션 재갱신 및 Redis Cluster 오류 대응"""

        logger.debug(f"세션 검증 시작: {session_id[:8]}... (최대 {max_retries + 1}회 시도)")

        for attempt in range(max_retries + 1):
            try:
                # 현재 시도에서 사용할 세션 ID 결정
                current_session_id = await self._get_current_session_id(session_id, request, attempt)

                # 재시도 시 대기
                if attempt > 0:
                    wait_time = 0.5 * attempt
                    logger.debug(f"재시도 전 대기: {wait_time}초")
                    await asyncio.sleep(wait_time)

                # 세션 유효성 검사
                logger.debug(f"세션 검증 시도 {attempt + 1}: {current_session_id[:8]}...")
                user_info = await is_valid(current_session_id)

                if user_info is not None:
                    if attempt > 0:
                        logger.info(f"세션 재검증 성공 (시도 {attempt + 1}/{max_retries + 1}): {user_info.emp_nm}")
                    return user_info
                else:
                    logger.debug(f"세션 검증 실패 (시도 {attempt + 1}/{max_retries + 1}): {current_session_id[:8]}...")

            except Exception as e:
                logger.error(f"세션 검증 중 오류 (시도 {attempt + 1}/{max_retries + 1}): {e}")
                if attempt >= max_retries:
                    logger.error(f"세션 검증 최대 재시도 초과: {session_id[:8]}...")
                    return None

        logger.warning(f"모든 재시도 실패: {session_id[:8]}...")
        return None

    async def _get_current_session_id(self, original_session_id: str, request: Request, attempt: int) -> str:
        """현재 시도에서 사용할 세션 ID를 결정"""
        if attempt == 0:
            return original_session_id

        # 재시도 시에는 최신 쿠키에서 세션 ID 다시 확인
        cookie_header = request.headers.get('cookie', '')
        if 'AX=' not in cookie_header:
            return original_session_id

        # 쿠키 헤더에서 AX 추출하고 Redis 키 형식으로 변환
        for cookie_part in cookie_header.split(';'):
            cookie_part = cookie_part.strip()
            if cookie_part.startswith('AX='):
                new_ax_cookie = cookie_part.split('=', 1)[1]
                new_session_id = f"AX:{new_ax_cookie}"
                if new_session_id != original_session_id:
                    logger.info(f"세션 재갱신 감지: {original_session_id[:8]}... -> {new_session_id[:8]}...")
                    return new_session_id
                break

        return original_session_id


def get_user_info_from_request(request: Request) -> Optional[UserModel]:
    """Request에서 사용자 정보 추출"""
    return getattr(request.state, 'user_info', None)


def is_session_validated(request: Request) -> bool:
    """세션 검증 여부 확인"""
    return getattr(request.state, 'session_validated', False)
