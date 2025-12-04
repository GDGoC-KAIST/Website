#!/bin/bash
# Verification script for OpenAPI TipTapDoc schema injection
# Usage: ./verify-openapi.sh

set -e

echo "🔍 Verifying TipTapDoc in OpenAPI spec..."

# Navigate to functions directory if not already there
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Step 1: Source emulator environment variables (if available)
ENV_FILE="../.tmp/emulators.env"
if [ -f "$ENV_FILE" ]; then
  echo "📋 Loading emulator config from $ENV_FILE"
  set -a  # Export all variables
  source "$ENV_FILE" 2>/dev/null || true
  set +a
else
  echo "⚠️  Warning: $ENV_FILE not found, trying fallback methods..."
fi

# Step 2: Extract host from FUNCTIONS_EMULATOR_HOST or use default
if [ -n "$FUNCTIONS_EMULATOR_HOST" ]; then
  EMULATOR_HOST="$FUNCTIONS_EMULATOR_HOST"
  echo "✅ Found FUNCTIONS_EMULATOR_HOST: $EMULATOR_HOST"
else
  # Fallback: Try to detect from firebase.json or use default
  EMULATOR_HOST="127.0.0.1:5001"
  echo "⚠️  Using fallback host: $EMULATOR_HOST"
fi

# Step 3: Build the full URL
# Adjust project ID and region based on your firebase.json
PROJECT_ID="demo-test"
REGION="us-central1"
FUNCTION_NAME="apiV2"
BASE_URL="http://${EMULATOR_HOST}/${PROJECT_ID}/${REGION}/${FUNCTION_NAME}"
OPENAPI_URL="${BASE_URL}/v2/openapi.json"

echo "📡 Target URL: $OPENAPI_URL"

# Step 4: Fetch and verify
echo ""
echo "🔄 Fetching OpenAPI spec..."
RESPONSE=$(curl -s "$OPENAPI_URL" 2>&1)
CURL_EXIT=$?

if [ $CURL_EXIT -ne 0 ]; then
  echo "❌ FAIL: Could not reach emulator endpoint"
  echo "   Error: $RESPONSE"
  echo ""
  echo "💡 Troubleshooting:"
  echo "   1. Is the emulator running? (firebase emulators:start)"
  echo "   2. Check the emulator UI at http://localhost:4000"
  echo "   3. Verify the function is deployed to the emulator"
  exit 1
fi

# Step 5: Check for TipTapDoc in the response
if echo "$RESPONSE" | grep -q "TipTapDoc"; then
  echo "✅ PASS: TipTapDoc schema found in OpenAPI spec"
  echo ""
  echo "📄 Occurrences:"
  echo "$RESPONSE" | grep -n "TipTapDoc" | head -5
  echo ""

  # Step 6: Verify the schema structure (if jq is available)
  if command -v jq &> /dev/null; then
    echo "🔍 Schema definition:"
    echo "$RESPONSE" | jq '.components.schemas.TipTapDoc'
  fi

  exit 0
else
  echo "❌ FAIL: TipTapDoc schema NOT found in OpenAPI spec"
  echo ""
  echo "🔍 Available schemas:"
  if command -v jq &> /dev/null; then
    echo "$RESPONSE" | jq '.components.schemas | keys'
  else
    echo "$RESPONSE" | grep -o '"[^"]*":' | head -20
  fi
  exit 1
fi
