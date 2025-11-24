#!/bin/bash

# Firebase Functions 에뮬레이터 테스트 스크립트
BASE_URL="http://127.0.0.1:5001/gdgoc-web/us-central1"

echo "=== 이미지 목록 조회 (GET) ==="
curl -X GET "${BASE_URL}/getImages" \
  -H "Content-Type: application/json" \
  | jq '.' || echo ""

echo -e "\n=== 이미지 목록 조회 (limit=5) ==="
curl -X GET "${BASE_URL}/getImages?limit=5" \
  -H "Content-Type: application/json" \
  | jq '.' || echo ""

echo -e "\n=== 이미지 생성 (POST) ==="
# 테스트 이미지 파일이 필요합니다. 실제 파일 경로로 변경하세요.
# curl -X POST "${BASE_URL}/createImage" \
#   -F "name=테스트 이미지" \
#   -F "description=curl로 업로드한 이미지" \
#   -F "file=@/path/to/image.jpg" \
#   | jq '.' || echo ""

echo -e "\n=== 단일 이미지 조회 (GET) ==="
# 위에서 생성한 이미지 ID를 사용하세요
# IMAGE_ID="your-image-id"
# curl -X GET "${BASE_URL}/getImage/${IMAGE_ID}" \
#   -H "Content-Type: application/json" \
#   | jq '.' || echo ""

echo -e "\n=== 이미지 업데이트 (PUT) ==="
# IMAGE_ID="your-image-id"
# curl -X PUT "${BASE_URL}/updateImage/${IMAGE_ID}" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "name": "수정된 이름",
#     "description": "수정된 설명"
#   }' \
#   | jq '.' || echo ""

echo -e "\n=== 이미지 삭제 (DELETE) ==="
# IMAGE_ID="your-image-id"
# curl -X DELETE "${BASE_URL}/deleteImage/${IMAGE_ID}" \
#   -H "Content-Type: application/json" \
#   | jq '.' || echo ""

echo -e "\n=== 멤버 생성 (POST) ==="
curl -X POST "${BASE_URL}/createMember" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "홍길동",
    "email": "hong@example.com",
    "department": "컴퓨터공학과",
    "githubUsername": "octocat"
  }' \
  | jq '.' || echo ""

echo -e "\n=== 멤버 목록 조회 (GET) ==="
curl -X GET "${BASE_URL}/getMembers" \
  -H "Content-Type: application/json" \
  | jq '.' || echo ""

echo -e "\n=== 단일 멤버 조회 (GET) ==="
# 위에서 생성한 멤버 ID를 사용하세요
# MEMBER_ID="your-member-id"
# curl -X GET "${BASE_URL}/getMember/${MEMBER_ID}" \
#   -H "Content-Type: application/json" \
#   | jq '.' || echo ""

echo -e "\n=== 멤버 업데이트 (PUT) ==="
# MEMBER_ID="your-member-id"
# curl -X PUT "${BASE_URL}/updateMember/${MEMBER_ID}" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "name": "홍길동 수정",
#     "department": "전기전자공학과"
#   }' \
#   | jq '.' || echo ""

echo -e "\n=== 멤버 삭제 (DELETE) ==="
# MEMBER_ID="your-member-id"
# curl -X DELETE "${BASE_URL}/deleteMember/${MEMBER_ID}" \
#   -H "Content-Type: application/json" \
#   | jq '.' || echo ""

echo -e "\n=== API 문서 (Swagger UI) ==="
echo "브라우저에서 접속: ${BASE_URL}/apiDocs"

echo -e "\n=== API 스펙 (OpenAPI JSON) ==="
curl -X GET "${BASE_URL}/apiSpec" \
  -H "Content-Type: application/json" \
  | jq '.' || echo ""

