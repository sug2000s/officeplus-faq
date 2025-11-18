#!/bin/bash

# OfficePlus FAQ Backend 설정 스크립트

cd "$(dirname "$0")"

echo "📦 Python 가상환경 생성..."
python3 -m venv venv

echo "📦 가상환경 활성화..."
source venv/bin/activate

echo "📦 Python 패키지 설치..."
pip install -r requirements.txt

echo "📦 환경 변수 파일 확인..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env 파일이 없습니다. .env.example을 복사합니다..."
    cp .env.example .env
    echo "✏️  .env 파일을 열어서 데이터베이스 설정을 확인하세요."
fi

echo ""
echo "✅ 백엔드 설정 완료!"
echo ""
echo "다음 단계:"
echo "1. .env 파일에서 데이터베이스 정보 확인/수정"
echo "2. 데이터베이스 초기화: PYTHONPATH=\$(pwd) python app/db/init_db.py"
echo "3. 서버 실행: ./run.sh"
