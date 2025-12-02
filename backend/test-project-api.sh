#!/bin/bash

# 프로젝트 API 테스트 스크립트
# 사용법: ./test-project-api.sh <ADMIN_USER_ID>

BASE_URL="http://127.0.0.1:5001/website-7ee8f/us-central1"

if [ -z "$1" ]; then
  echo "사용법: ./test-project-api.sh <ADMIN_USER_ID>"
  echo ""
  echo "Admin ID를 모르는 경우:"
  echo "1. ./create-admin.sh <GITHUB_TOKEN> 실행"
  echo "2. Firestore UI에서 users 컬렉션의 isAdmin=true인 사용자 ID 확인"
  echo ""
  echo "또는 환경변수 사용:"
  echo "  export ADMIN_ID=\"your-admin-user-id\""
  echo "  ./test-project-api.sh \$ADMIN_ID"
  exit 1
fi

ADMIN_ID=$1

echo "=== 프로젝트 API 테스트 ==="
echo "Admin ID: ${ADMIN_ID}"
echo ""

# 1. 프로젝트 생성
echo "1. 프로젝트 생성 (POST /createProject)..."
CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/createProject" \
  -H "Content-Type: application/json" \
  -d "{
    \"adminId\": \"${ADMIN_ID}\",
    \"title\": \"GDGoC 웹사이트\",
    \"summary\": \"GDGoC KAIST 공식 웹사이트 프로젝트\",
    \"description\": \"동아리 소개, 프로젝트 아카이빙, 멤버 관리 기능\",
    \"semester\": \"2024-2\",
    \"status\": \"ongoing\",
    \"githubUrl\": \"https://github.com/GDGoC-KAIST/Website\",
    \"teamMembers\": [\"김철수\", \"이영희\", \"박지민\"],
    \"techStack\": [\"Next.js\", \"Firebase\", \"TypeScript\", \"Tailwind CSS\"]
  }")

echo "$CREATE_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_RESPONSE"
echo ""

PROJECT_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id' 2>/dev/null)

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "null" ]; then
  echo "❌ 프로젝트 생성 실패"
  echo "Admin ID가 올바른지 확인하세요."
  exit 1
fi

echo "✅ 프로젝트 생성 완료! ID: ${PROJECT_ID}"
echo ""

# 2. 프로젝트 목록 조회 (Public)
echo "2. 프로젝트 목록 조회 (GET /getProjects)..."
curl -s -X GET "${BASE_URL}/getProjects?limit=10" \
  -H "Content-Type: application/json" \
  | jq '.' || echo ""
echo ""

# 3. 학기별 필터링
echo "3. 학기별 필터링 (GET /getProjects?semester=2024-2)..."
curl -s -X GET "${BASE_URL}/getProjects?semester=2024-2" \
  -H "Content-Type: application/json" \
  | jq '.' || echo ""
echo ""

# 4. 상태별 필터링
echo "4. 상태별 필터링 (GET /getProjects?status=ongoing)..."
curl -s -X GET "${BASE_URL}/getProjects?status=ongoing" \
  -H "Content-Type: application/json" \
  | jq '.' || echo ""
echo ""

# 5. 단일 프로젝트 조회 (Public)
echo "5. 단일 프로젝트 조회 (GET /getProject/${PROJECT_ID})..."
curl -s -X GET "${BASE_URL}/getProject/${PROJECT_ID}" \
  -H "Content-Type: application/json" \
  | jq '.' || echo ""
echo ""

# 6. 프로젝트 업데이트 (Admin Only)
echo "6. 프로젝트 업데이트 (PUT /updateProject/${PROJECT_ID})..."
curl -s -X PUT "${BASE_URL}/updateProject/${PROJECT_ID}" \
  -H "Content-Type: application/json" \
  -d "{
    \"adminId\": \"${ADMIN_ID}\",
    \"status\": \"completed\",
    \"description\": \"프로젝트가 완료되었습니다!\"
  }" \
  | jq '.' || echo ""
echo ""

# 7. README 갱신 (Admin Only)
echo "7. README 수동 갱신 (POST /refreshProjectReadme/${PROJECT_ID})..."
curl -s -X POST "${BASE_URL}/refreshProjectReadme/${PROJECT_ID}" \
  -H "Content-Type: application/json" \
  -d "{
    \"adminId\": \"${ADMIN_ID}\"
  }" \
  | jq '.' || echo ""
echo ""

# 8. 추가 프로젝트 생성 (다양한 테스트)
echo "8. 추가 프로젝트 생성..."
curl -s -X POST "${BASE_URL}/createProject" \
  -H "Content-Type: application/json" \
  -d "{
    \"adminId\": \"${ADMIN_ID}\",
    \"title\": \"AI 챗봇 프로젝트\",
    \"summary\": \"LLM 기반 대화형 챗봇\",
    \"semester\": \"2024-1\",
    \"status\": \"completed\",
    \"teamMembers\": [\"홍길동\", \"김영희\"],
    \"techStack\": [\"Python\", \"OpenAI\", \"FastAPI\"]
  }" \
  | jq '.' || echo ""
echo ""

# 9. 전체 프로젝트 목록 재확인
echo "9. 전체 프로젝트 목록 (GET /getProjects)..."
curl -s -X GET "${BASE_URL}/getProjects" \
  -H "Content-Type: application/json" \
  | jq '.' || echo ""
echo ""

# 10. 프로젝트 삭제 (주석 처리 - 필요시 활성화)
echo "10. 프로젝트 삭제 (선택 사항)"
echo "   삭제하려면 아래 명령어 실행:"
echo "   curl -X DELETE ${BASE_URL}/deleteProject/${PROJECT_ID} \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"adminId\": \"${ADMIN_ID}\"}'"
echo ""

# 실제 삭제 실행 (주석 해제하려면 아래 주석 제거)
# echo "   프로젝트 삭제 실행 중..."
# curl -s -X DELETE "${BASE_URL}/deleteProject/${PROJECT_ID}" \
#   -H "Content-Type: application/json" \
#   -d "{\"adminId\": \"${ADMIN_ID}\"}" \
#   | jq '.' || echo ""
# echo ""

echo "=== 테스트 완료 ==="
echo ""
echo "💡 추가 테스트 명령어:"
echo ""
echo "# GitHub README가 있는 프로젝트 생성 (README 자동 가져오기)"
echo "curl -X POST ${BASE_URL}/createProject \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"adminId\": \"${ADMIN_ID}\","
echo "    \"title\": \"React 프로젝트\","
echo "    \"summary\": \"React 기반 웹앱\","
echo "    \"semester\": \"2024-2\","
echo "    \"status\": \"ongoing\","
echo "    \"githubUrl\": \"https://github.com/facebook/react\","
echo "    \"teamMembers\": [\"Developer\"],"
echo "    \"techStack\": [\"React\"]"
echo "  }'"
echo ""
echo "# 결과를 보려면:"
echo "curl ${BASE_URL}/getProjects | jq '.projects[] | {title, readmeContent}'"
