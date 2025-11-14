#!/bin/bash

# 이메일 발송 테스트 스크립트
# 사용법: ./test-email.sh <GITHUB_ACCESS_TOKEN>

BASE_URL="http://localhost:5001/gdgoc-web/us-central1"

if [ -z "$1" ]; then
  echo "사용법: ./test-email.sh <GITHUB_ACCESS_TOKEN>"
  echo ""
  echo "이 스크립트는 다음을 테스트합니다:"
  echo "1. 신규 사용자 가입 요청 → 관리자에게 이메일 발송"
  echo "2. 승인/거부 후 → 사용자에게 결과 이메일 발송"
  echo ""
  echo "사전 준비:"
  echo "1. .env 파일에 EMAIL_USER와 EMAIL_PASSWORD 설정"
  echo "2. 에뮬레이터 실행 중 (npx firebase emulators:start)"
  echo "3. 관리자 멤버가 members 컬렉션에 isAdmin=true로 등록되어 있어야 함"
  exit 1
fi

GITHUB_TOKEN=$1

echo "=== 이메일 발송 테스트 ==="
echo ""

# 1. 관리자 목록 확인
echo "1. 관리자 목록 확인..."
ADMINS=$(curl -s "${BASE_URL}/getAdmins")
echo "$ADMINS" | jq '.' 2>/dev/null || echo "$ADMINS"
echo ""

ADMIN_COUNT=$(echo "$ADMINS" | jq -r '.count' 2>/dev/null)
if [ "$ADMIN_COUNT" = "0" ] || [ "$ADMIN_COUNT" = "null" ]; then
  echo "⚠️  경고: 관리자가 없습니다!"
  echo "멤버를 생성하고 isAdmin=true로 설정해주세요."
  echo ""
fi

# 2. 신규 사용자 가입 요청 (이메일 발송 트리거)
echo "2. 신규 사용자 가입 요청 (관리자에게 이메일 발송)..."
RESPONSE=$(curl -s -X POST "${BASE_URL}/loginWithGitHub" \
  -H "Content-Type: application/json" \
  -d "{\"accessToken\": \"${GITHUB_TOKEN}\"}")

echo "응답:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

USER_ID=$(echo "$RESPONSE" | jq -r '.user.id' 2>/dev/null)
IS_NEW_USER=$(echo "$RESPONSE" | jq -r '.isNewUser' 2>/dev/null)

if [ -n "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
  if [ "$IS_NEW_USER" = "true" ]; then
    echo "✅ 신규 사용자 생성 완료!"
    echo "📧 관리자 이메일을 확인하세요 (가입 요청 알림)"
    echo ""
    
    # 3. 승인 상태 확인
    echo "3. 승인 상태 확인..."
    STATUS=$(curl -s "${BASE_URL}/checkApprovalStatus?userId=${USER_ID}")
    echo "$STATUS" | jq '.' 2>/dev/null || echo "$STATUS"
    echo ""
    
    echo "=== 다음 단계 ==="
    echo "1. 관리자 이메일에서 승인/거부 링크 클릭"
    echo "   또는 아래 명령어로 승인/거부:"
    echo ""
    echo "   # 승인 (adminId는 관리자 userId 필요)"
    echo "   curl -X POST ${BASE_URL}/approveUser \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -d '{\"userId\": \"${USER_ID}\", \"adminId\": \"ADMIN_USER_ID\"}'"
    echo ""
    echo "   # 거부"
    echo "   curl -X POST ${BASE_URL}/rejectUser \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -d '{\"userId\": \"${USER_ID}\", \"adminId\": \"ADMIN_USER_ID\"}'"
    echo ""
    echo "2. 승인/거부 후 사용자 이메일 확인 (결과 이메일)"
  else
    echo "ℹ️  기존 사용자입니다. 신규 사용자로 테스트하려면 다른 GitHub 계정을 사용하세요."
  fi
else
  echo "❌ 사용자 생성 실패"
  exit 1
fi

echo ""
echo "=== 테스트 완료 ==="

