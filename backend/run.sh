#!/bin/bash

# OfficePlus FAQ Backend 실행 스크립트

cd "$(dirname "$0")"

# 가상환경 활성화
if [ ! -d "venv" ]; then
    echo "가상환경을 찾을 수 없습니다. 먼저 setup.sh를 실행하세요."
    exit 1
fi

source venv/bin/activate

# 환경 변수 로드
if [ ! -f ".env" ]; then
    echo ".env 파일이 없습니다. .env.example을 복사하여 .env를 생성하세요."
    exit 1
fi

# PYTHONPATH 설정
export PYTHONPATH=$(pwd)

# 서버 실행
echo "🚀 FastAPI 서버 시작..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
