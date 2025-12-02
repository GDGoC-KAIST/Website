#!/bin/bash

# 초기 Admin 사용자 생성 스크립트
# 사용법: ./create-admin.sh <GITHUB_ACCESS_TOKEN>

BASE_URL="http://127.0.0.1:5001/website-7ee8f/us-central1"

if [ -z "$1" ]; then
  echo "사용법: ./create-admin.sh <GITHUB_ACCESS_TOKEN>"
  echo ""
  echo "이 스크립트는 다음을 수행합니다:"
  echo "1. GitHub OAuth로 사용자 생성 (pending 상태)"
  echo "2. Firestore에서 해당 사용자를 admin으로 수동 설정하는 방법 안내"
  echo ""
  echo "GitHub 토큰 발급:"
  echo "1. https://github.com/settings/tokens 접속"
  echo "2. 'Generate new token (classic)' 클릭"
  echo "3. Scopes: read:user, user:email 선택"
  echo "4. 생성된 토큰 복사 (ghp_xxxx 형식)"
  exit 1
fi

GITHUB_TOKEN=$1

echo "=== 초기 Admin 사용자 생성 ==="
echo ""

# 1. GitHub OAuth로 사용자 생성
echo "1. GitHub OAuth로 사용자 생성 중..."
RESPONSE=$(curl -s -X POST "${BASE_URL}/loginWithGitHub" \
  -H "Content-Type: application/json" \
  -d "{\"accessToken\": \"${GITHUB_TOKEN}\"}")

echo "응답:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

USER_ID=$(echo "$RESPONSE" | jq -r '.user.id' 2>/dev/null)
USER_NAME=$(echo "$RESPONSE" | jq -r '.user.name' 2>/dev/null)
USER_EMAIL=$(echo "$RESPONSE" | jq -r '.user.email' 2>/dev/null)
GITHUB_USERNAME=$(echo "$RESPONSE" | jq -r '.user.githubUsername' 2>/dev/null)

if [ -z "$USER_ID" ] || [ "$USER_ID" = "null" ]; then
  echo "❌ 사용자 생성 실패"
  exit 1
fi

echo "✅ 사용자 생성 완료!"
echo "   User ID: ${USER_ID}"
echo "   이름: ${USER_NAME}"
echo "   이메일: ${USER_EMAIL}"
echo "   GitHub: ${GITHUB_USERNAME}"
echo ""

# 2. Firestore에서 admin 설정 안내
echo "=== Admin 권한 부여 방법 ==="
echo ""
echo "Option 1: Firestore UI에서 수동 설정 (추천)"
echo "----------------------------------------"
echo "1. 브라우저에서 http://localhost:4000 접속"
echo "2. 왼쪽 메뉴에서 'Firestore' 클릭"
echo "3. 'users' 컬렉션 → '${USER_ID}' 문서 클릭"
echo "4. 'isAdmin' 필드를 찾아서 'false'를 'true'로 변경"
echo "5. 'Save' 버튼 클릭"
echo ""

echo "Option 2: curl로 직접 Firestore 에뮬레이터에 설정"
echo "---------------------------------------------------"
echo "curl -X PATCH \"http://localhost:8080/v1/projects/website-7ee8f/databases/(default)/documents/users/${USER_ID}\" \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"fields\": {\"isAdmin\": {\"booleanValue\": true}}}'"
echo ""

# 3. Admin 설정 확인
echo "=== Admin 설정 후 확인 방법 ==="
echo ""
echo "# Admin 여부 확인"
echo "curl -X GET \"${BASE_URL}/getUser?userId=${USER_ID}\" | jq '.user.isAdmin'"
echo ""

echo "=== Admin ID 사용 예시 ==="
echo ""
echo "# 프로젝트 생성 (Admin 전용)"
echo "curl -X POST ${BASE_URL}/createProject \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"adminId\": \"${USER_ID}\","
echo "    \"title\": \"테스트 프로젝트\","
echo "    \"summary\": \"프로젝트 요약\","
echo "    \"semester\": \"2024-2\","
echo "    \"status\": \"ongoing\","
echo "    \"teamMembers\": [\"${USER_NAME}\"],"
echo "    \"techStack\": [\"React\", \"Firebase\"]"
echo "  }'"
echo ""

echo "=== 완료 ==="
echo ""
echo "💡 Admin ID를 환경변수로 저장하려면:"
echo "   export ADMIN_ID=\"${USER_ID}\""
echo ""
echo "   그 다음 다른 스크립트에서 \$ADMIN_ID 사용 가능"
