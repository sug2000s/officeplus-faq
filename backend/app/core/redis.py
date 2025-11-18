"""Redis 연결 및 세션 관리"""
import redis
from redis.cluster import RedisCluster
from redis.cluster import ClusterNode
import os
import logging
import json
from typing import Optional, Union, List, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

MAX_CONNECTION_POOL = 20
SSO_SESSION_TIMEOUT = 60 * 60 * 24  # 24시간


class RedisConfig:
    """Redis 설정"""

    def __init__(self):
        self.host = os.getenv('REDIS_HOST', 'localhost')
        self.port = int(os.getenv('REDIS_PORT', 6379))
        self.db = int(os.getenv('REDIS_DB', 0))
        self.password = os.getenv('REDIS_PASSWORD', '')
        self.cluster_mode = os.getenv('REDIS_CLUSTER_MODE', 'false').lower() == 'true'

        # Redis URL 생성
        if self.password:
            self.url = f"redis://:{self.password}@{self.host}:{self.port}"
        else:
            self.url = f"redis://{self.host}:{self.port}"

        logger.info(f"Redis 설정: {self.host}:{self.port}, 클러스터 모드: {self.cluster_mode}")


redis_config = RedisConfig()


class RedisConnectionPool:
    """Redis 연결 풀 관리"""

    def __init__(self):
        self._pool: Optional[redis.ConnectionPool] = None
        self._redis_client: Optional[Union[redis.Redis, RedisCluster]] = None
        self._is_cluster: bool = False

    def get_connection(self) -> Union[redis.Redis, RedisCluster]:
        """Redis 연결 객체를 반환합니다."""
        if self._redis_client is None:
            self._init_connection()
        return self._redis_client

    def _init_connection(self):
        """Redis 연결을 초기화합니다"""
        try:
            if redis_config.cluster_mode:
                # Redis Cluster 모드
                self._is_cluster = True

                try:
                    # redis-py >= 4.3.0
                    startup_nodes = [
                        ClusterNode(redis_config.host, redis_config.port)
                    ]

                    self._redis_client = RedisCluster(
                        startup_nodes=startup_nodes,
                        password=redis_config.password if redis_config.password else None,
                        decode_responses=True,
                        max_connections=MAX_CONNECTION_POOL,
                        skip_full_coverage_check=True
                    )

                except (ImportError, TypeError):
                    # 이전 버전 또는 단순화된 방식
                    try:
                        self._redis_client = RedisCluster(
                            host=redis_config.host,
                            port=redis_config.port,
                            password=redis_config.password if redis_config.password else None,
                            decode_responses=True,
                            max_connections=MAX_CONNECTION_POOL,
                            skip_full_coverage_check=True
                        )
                    except:
                        # from_url 사용
                        self._redis_client = RedisCluster.from_url(
                            redis_config.url,
                            decode_responses=True,
                            max_connections=MAX_CONNECTION_POOL,
                            skip_full_coverage_check=True
                        )

                logger.info(f"Redis Cluster 연결 초기화: {redis_config.host}:{redis_config.port}")

            else:
                # 단일 Redis 모드
                self._is_cluster = False
                self._pool = redis.ConnectionPool(
                    host=redis_config.host,
                    port=redis_config.port,
                    db=redis_config.db,
                    password=redis_config.password if redis_config.password else None,
                    decode_responses=True,
                    max_connections=MAX_CONNECTION_POOL,
                    retry_on_timeout=True,
                    health_check_interval=30
                )

                self._redis_client = redis.Redis(connection_pool=self._pool)
                logger.info(f"Redis 단일 모드 연결 초기화: {redis_config.host}:{redis_config.port}")

        except Exception as e:
            logger.error(f"Redis 연결 초기화 실패: {e}")
            # 폴백: 단일 Redis 모드로 시도
            try:
                logger.warning("Redis Cluster 연결 실패, 단일 모드로 폴백 시도")
                self._is_cluster = False

                if redis_config.password:
                    url = f"redis://:{redis_config.password}@{redis_config.host}:{redis_config.port}/{redis_config.db}"
                else:
                    url = f"redis://{redis_config.host}:{redis_config.port}/{redis_config.db}"

                self._redis_client = redis.from_url(
                    url,
                    decode_responses=True,
                    max_connections=MAX_CONNECTION_POOL
                )
                logger.info(f"Redis 단일 모드 폴백 성공: {redis_config.host}:{redis_config.port}")
            except Exception as fallback_error:
                logger.error(f"Redis 폴백 연결도 실패: {fallback_error}")
                raise

    def refresh_connection(self):
        """연결을 새로 고침합니다"""
        try:
            if self._is_cluster and hasattr(self._redis_client, 'reset'):
                self._redis_client.reset()
                logger.info("Redis Cluster 연결 갱신 완료")
            else:
                self.close()
                self._init_connection()
                logger.info("Redis 연결 재초기화 완료")
        except Exception as e:
            logger.error(f"Redis 연결 갱신 실패: {e}")
            self.close()
            self._init_connection()

    def close(self):
        """연결을 종료합니다."""
        try:
            if self._redis_client:
                if hasattr(self._redis_client, 'close'):
                    self._redis_client.close()
                self._redis_client = None

            if self._pool:
                self._pool.disconnect()
                self._pool = None
        except Exception as e:
            logger.error(f"Redis 연결 종료 중 오류: {e}")

    def test_connection(self) -> bool:
        """연결 테스트"""
        try:
            client = self.get_connection()
            client.ping()
            return True
        except Exception as e:
            logger.error(f"Redis 연결 테스트 실패: {e}")
            return False


# 전역 인스턴스
redis_connection_pool = RedisConnectionPool()


class ConversationMessage:
    """대화 메시지 클래스"""

    def __init__(self, role: str, content: str, timestamp: datetime = None, metadata: Dict[str, Any] = None):
        self.role = role  # 'user' 또는 'assistant'
        self.content = content
        self.timestamp = timestamp or datetime.now()
        self.metadata = metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ConversationMessage':
        return cls(
            role=data["role"],
            content=data["content"],
            timestamp=datetime.fromisoformat(data["timestamp"]),
            metadata=data.get("metadata", {})
        )


class RedisSessionManager:
    """Redis 기반 세션 관리자"""

    def __init__(self):
        self.redis: Optional[Union[redis.Redis, RedisCluster]] = None
        self.session_prefix = "officeplus_faq:session:"
        self.ttl_seconds = int(os.getenv('SESSION_TTL', '3600'))
        self._connected = False

    async def connect(self):
        """Redis 연결 초기화"""
        await self.startup()

    async def startup(self):
        """Redis 연결 초기화"""
        try:
            if redis_config.cluster_mode:
                self.redis = RedisCluster.from_url(
                    redis_config.url,
                    encoding="utf-8",
                    decode_responses=True,
                    max_connections=MAX_CONNECTION_POOL
                )
                logger.info(f"Redis Cluster 연결 시도: {redis_config.url}")
            else:
                self.redis = redis.Redis(
                    host=redis_config.host,
                    port=redis_config.port,
                    db=redis_config.db,
                    password=redis_config.password if redis_config.password else None,
                    encoding="utf-8",
                    decode_responses=True,
                    max_connections=MAX_CONNECTION_POOL
                )
                logger.info(f"Redis 단일 노드 연결 시도: {redis_config.host}:{redis_config.port}")

            # 연결 테스트
            self.redis.ping()
            self._connected = True
            logger.info(f"✅ Redis Session Manager 연결 성공")

        except Exception as e:
            logger.error(f"❌ Redis Session Manager 연결 실패: {e}")
            self._connected = False
            raise

    async def disconnect(self):
        """Redis 연결 종료"""
        await self.shutdown()

    async def shutdown(self):
        """Redis 연결 종료"""
        if self.redis:
            self.redis.close()
            self._connected = False
            logger.info("✅ Redis Session Manager 연결 종료")

    def _ensure_connection(self):
        """연결 상태 확인"""
        if not self._connected or not self.redis:
            raise ConnectionError("Redis 연결이 초기화되지 않았습니다. startup()을 먼저 호출하세요.")

    def _get_session_key(self, session_id: str) -> str:
        """세션 키 생성"""
        return f"{self.session_prefix}{session_id}"

    async def get_conversation_history(self, session_id: str, limit: int = 50) -> List[ConversationMessage]:
        """대화 이력 조회"""
        try:
            self._ensure_connection()
            session_key = self._get_session_key(session_id)

            messages_data = self.redis.lrange(session_key, -limit, -1)

            messages = []
            for msg_json in messages_data:
                try:
                    msg_dict = json.loads(msg_json)
                    messages.append(ConversationMessage.from_dict(msg_dict))
                except json.JSONDecodeError as e:
                    logger.warning(f"메시지 파싱 오류: {e}")
                    continue

            logger.debug(f"대화 이력 조회 완료: {session_id}, {len(messages)}개 메시지")
            return messages

        except Exception as e:
            logger.error(f"대화 이력 조회 오류: {e}")
            return []

    async def add_message(self, session_id: str, message: ConversationMessage):
        """대화 이력에 메시지 추가"""
        try:
            self._ensure_connection()
            session_key = self._get_session_key(session_id)
            msg_json = json.dumps(message.to_dict(), ensure_ascii=False)

            self.redis.lpush(session_key, msg_json)
            self.redis.expire(session_key, self.ttl_seconds)
            self.redis.ltrim(session_key, 0, 199)  # 최대 200개 메시지 유지

            logger.debug(f"메시지 추가 완료: {session_id}")

        except Exception as e:
            logger.error(f"메시지 추가 오류: {e}")
            raise

    async def clear_session(self, session_id: str):
        """세션 대화 이력 삭제"""
        try:
            self._ensure_connection()
            session_key = self._get_session_key(session_id)
            self.redis.delete(session_key)
            logger.info(f"세션 {session_id} 이력 삭제 완료")

        except Exception as e:
            logger.error(f"세션 삭제 오류: {e}")
            raise
