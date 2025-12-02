#!/bin/bash

# Firestore 에뮬레이터 데이터 초기화 스크립트

echo "=== Firestore 에뮬레이터 데이터 초기화 ==="
echo ""

# 에뮬레이터가 실행 중인지 확인
if ! lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
  echo "에뮬레이터가 실행 중이지 않습니다."
  echo "먼저 에뮬레이터를 실행하세요: npx firebase emulators:start"
  exit 1
fi

echo "에뮬레이터 데이터를 초기화합니다..."
echo ""

# 방법 1: 에뮬레이터 재시작 (가장 확실한 방법)
echo "방법 1: 에뮬레이터 재시작 (권장)"
echo "에뮬레이터를 중지하고 다시 시작하면 데이터가 초기화됩니다."
echo ""
echo "Ctrl+C로 에뮬레이터를 중지한 후:"
echo "  npx firebase emulators:start"
echo ""

# 방법 2: Firestore 에뮬레이터 API 사용
echo "방법 2: Firestore 에뮬레이터 API로 데이터 삭제"
echo "다음 명령어로 모든 컬렉션을 삭제할 수 있습니다:"
echo ""
echo "  curl -X DELETE http://localhost:8080/emulator/v1/projects/gdgoc-web/databases/(default)/documents"
echo ""

read -p "지금 삭제하시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "데이터 삭제 중..."
  RESPONSE=$(curl -s -X DELETE http://localhost:8080/emulator/v1/projects/gdgoc-web/databases/(default)/documents)
  
  if [ $? -eq 0 ]; then
    echo "데이터 삭제 완료!"
  else
    echo "데이터 삭제 실패"
    echo "에뮬레이터가 실행 중인지 확인하세요."
  fi
fi

echo ""
echo "=== 완료 ==="

