#!/bin/bash

# API 문서 HTML 및 JSON 파일 생성 스크립트

BASE_URL="${1:-http://localhost:5001/gdgoc-web/us-central1}"
OUTPUT_HTML="${2:-api-docs.html}"
OUTPUT_JSON="${3:-api-docs.json}"

echo "📄 API 문서 파일 생성 중..."
echo "   Base URL: $BASE_URL"
echo "   HTML 파일: $OUTPUT_HTML"
echo "   JSON 파일: $OUTPUT_JSON"
echo ""

# OpenAPI 스펙 JSON 가져오기
if [ -f "$OUTPUT_JSON" ]; then
    echo "1. 기존 JSON 파일 사용: $OUTPUT_JSON"
else
    echo "1. OpenAPI 스펙 JSON 다운로드 중..."
    curl -s "${BASE_URL}/apiSpec" > "$OUTPUT_JSON"
    
    if [ $? -ne 0 ] || [ ! -s "$OUTPUT_JSON" ]; then
        echo "❌ 실패: OpenAPI 스펙을 가져올 수 없습니다."
        echo "   에뮬레이터가 실행 중인지 확인하세요:"
        echo "   npm run firebase:emulators"
        exit 1
    fi
fi

# JSON 파일이 유효한지 확인
if command -v jq >/dev/null 2>&1; then
    if ! jq empty "$OUTPUT_JSON" 2>/dev/null; then
        echo "⚠️  경고: JSON 파일이 유효하지 않을 수 있습니다."
    fi
fi

# HTML 파일 생성 (JSON 인라인 포함 - CORS 문제 해결)
echo "2. HTML 파일 생성 중..."

# HTML 헤더 부분
cat > "$OUTPUT_HTML" << 'HTML_HEADER'
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API 테스트 - Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css">
  <style>
    body { margin: 0; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      // JSON을 인라인으로 포함 (CORS 문제 해결)
      const spec = 
HTML_HEADER

# JSON 내용 삽입 (이스케이프 처리)
cat "$OUTPUT_JSON" >> "$OUTPUT_HTML"

# HTML 푸터 부분
cat >> "$OUTPUT_HTML" << 'HTML_FOOTER'
;
      const ui = SwaggerUIBundle({
        spec: spec,
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>
HTML_FOOTER

echo ""
echo "✅ 성공! 파일이 생성되었습니다:"
echo "   📄 HTML: $OUTPUT_HTML"
echo "   📋 JSON: $OUTPUT_JSON"
echo ""
echo "브라우저에서 열기:"
echo "   open $OUTPUT_HTML"
echo "   또는 파일을 더블클릭하세요"
echo ""
echo "💡 팁: HTML과 JSON 파일을 같은 디렉토리에 두면"
echo "   에뮬레이터 없이도 API 문서를 볼 수 있습니다!"

