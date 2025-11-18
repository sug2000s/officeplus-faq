"""인증 및 세션 검증 유틸리티"""
import json
import logging
import os
from typing import Optional
import asyncio

from app.models.user import UserModel
from app.core.redis import redis_connection_pool

logger = logging.getLogger(__name__)

SSO_SESSION_TIMEOUT = 60 * 60 * 24  # 24시간


async def is_valid(auth_key: str) -> Optional[UserModel]:
    """
    세션 유효성 검증 - Redis Cluster MovedError 처리 포함

    Args:
        auth_key: Redis 세션 키 (형식: AX:{쿠키값})

    Returns:
        UserModel: 사용자 정보 (세션이 유효한 경우)
        None: 세션이 유효하지 않거나 오류 발생
    """
    max_retries = 3

    for attempt in range(max_retries):
        try:
            # Redis 연결 및 데이터 조회
            redis_conn = redis_connection_pool.get_connection()
            if redis_conn is None:
                logger.error("Redis 연결 실패")
                return None

            # getex: GET + EXPIRE를 동시에 수행 (TTL 연장)
            user_info = redis_conn.getex(auth_key, SSO_SESSION_TIMEOUT)

            if user_info is not None:
                try:
                    user = json.loads(user_info)

                    # 필수 필드 검증
                    required_fields = ['id', 'email']
                    for field in required_fields:
                        if field not in user:
                            logger.warning(f"필수 필드 누락: {field} in session {auth_key[:8]}...")
                            return None

                    # UserModel 생성 및 필드 매핑
                    # 실제 Redis 필드: id, email, dept, corp 등
                    user_model = UserModel(
                        emp_no=user['id'].upper(),
                        emp_nm=user.get('email', '').split('@')[0],  # 이메일에서 이름 추출
                        dept_cd=user.get('dept', 'UNKNOWN'),
                        dept_nm=user.get('dept', 'UNKNOWN'),
                        pctr_cd=user.get('corp', 'UNKNOWN'),
                        dept_all_nm='',
                        title_nm='',
                        jc_nm='',
                        dept_l1_nm='',
                        dept_l2_nm='',
                        dept_l3_nm='',
                        dept_l4_nm='',
                        working_day_flag=True
                    )

                    logger.debug(f"세션 데이터 로드 성공: {user_model.emp_nm} ({user_model.emp_no})")
                    return user_model

                except json.JSONDecodeError as e:
                    logger.error(f"세션 데이터 JSON 파싱 오류: {e}")
                    return None
                except KeyError as e:
                    logger.error(f"세션 데이터 필드 오류: {e}")
                    return None
                except Exception as e:
                    logger.error(f"UserModel 생성 오류: {e}")
                    return None
            else:
                logger.debug(f"Redis에서 세션 데이터 없음: {auth_key[:8]}...")
                return None

        except Exception as e:
            error_msg = str(e)

            # Redis Cluster MovedError 처리
            if "MovedError" in error_msg or "MOVED" in error_msg:
                logger.warning(f"Redis Cluster MovedError 감지 (시도 {attempt + 1}/{max_retries}): {error_msg}")

                # 연결 풀 갱신
                try:
                    redis_connection_pool.refresh_connection()
                    logger.info("Redis 연결 갱신 완료")
                except Exception as refresh_error:
                    logger.error(f"Redis 연결 갱신 실패: {refresh_error}")

                # 마지막 시도가 아니면 재시도
                if attempt < max_retries - 1:
                    await asyncio.sleep(0.5 * (attempt + 1))  # 점진적 대기
                    continue
                else:
                    logger.error(f"Redis MovedError 최대 재시도 초과: {auth_key[:8]}...")
                    return None

            # 기타 예외
            else:
                logger.error(f"세션 검증 중 예외 발생: {e}")
                return None

    # 모든 재시도 실패
    logger.error(f"세션 검증 최대 재시도 초과: {auth_key[:8]}...")
    return None
