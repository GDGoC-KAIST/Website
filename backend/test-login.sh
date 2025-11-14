#!/bin/bash

# 로그인 기능 테스트 스크립트
# 사용법: ./test-login.sh <GITHUB_ACCESS_TOKEN>

BASE_URL="http://localhost:5001/gdgoc-web/us-central1"

if [ -z "$1" ]; then
  echo "사용법: ./test-login.sh <GITHUB_ACCESS_TOKEN>"
  echo ""
  echo "GitHub Personal Access Token 생성 방법:"
  echo "1. GitHub에 로그인"
  echo "2. Settings > Developer settings > Personal access tokens > Tokens (classic)"
  echo "3. 'Generate new token (classic)' 클릭"
  echo "4. Note: 'GDGoC Test' 입력"
  echo "5. Expiration: 원하는 기간 선택"
  echo "6. Scopes: 'read:user' 체크 (최소한)"
  echo "7. 'Generate token' 클릭 후 토큰 복사"
  exit 1
fi

GITHUB_TOKEN=$1

echo "=== GitHub 로그인 테스트 ==="
echo ""

# 1. 로그인/회원가입
echo "1. 로그인/회원가입 요청..."
RESPONSE=$(curl -s -X POST "${BASE_URL}/loginWithGitHub" \
  -H "Content-Type: application/json" \
  -d "{\"accessToken\": \"${GITHUB_TOKEN}\"}")

echo "응답:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# userId 추출 (jq가 있는 경우)
USER_ID=$(echo "$RESPONSE" | jq -r '.user.id' 2>/dev/null)

if [ -n "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
  echo "✅ 로그인 성공! User ID: $USER_ID"
  echo ""
  
  # 2. 사용자 정보 조회
  echo "2. 사용자 정보 조회..."
  USER_INFO=$(curl -s -X GET "${BASE_URL}/getUser?userId=${USER_ID}")
  echo "사용자 정보:"
  echo "$USER_INFO" | jq '.' 2>/dev/null || echo "$USER_INFO"
  echo ""
  
  # 3. 승인 상태 확인
  echo "3. 승인 상태 확인..."
  APPROVAL_STATUS=$(curl -s -X GET "${BASE_URL}/checkApprovalStatus?userId=${USER_ID}")
  echo "승인 상태:"
  echo "$APPROVAL_STATUS" | jq '.' 2>/dev/null || echo "$APPROVAL_STATUS"
  echo ""
else
  echo "❌ 로그인 실패"
  exit 1
fi

echo "=== 테스트 완료 ==="

