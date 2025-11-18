"""사용자 모델"""
from pydantic import BaseModel


class UserModel(BaseModel):
    """
    사용자 정보 모델 - 실제 Redis 필드 구조 기반

    Redis 저장 구조:
    {
        "id": "75385",
        "email": "wmw@lgcns.com",
        "dept": "98906",
        "corp": "LG01",
        "type": "I",
        "status": "C",
        "locale": "ko",
        "loginTime": "2025-11-10T04:01:37.6045521Z",
        "lastActivity": "2025-11-10T04:01:37.6045521Z"
    }
    """
    # 실제 Redis 필드 (기본 필드)
    emp_no: str = "LOCAL_DEV"  # Redis: id
    emp_nm: str = "local@lgcns.com"  # Redis: email
    dept_cd: str = "99999"  # Redis: dept
    dept_nm: str = "99999"  # Redis: dept (동일)
    pctr_cd: str = "LG00"  # Redis: corp

    # 추가 필드 (하위 호환성 유지)
    dept_all_nm: str = ""
    title_nm: str = ""
    jc_nm: str = ""
    dept_l1_nm: str = ""
    dept_l2_nm: str = ""
    dept_l3_nm: str = ""
    dept_l4_nm: str = ""
    working_day_flag: bool = True
