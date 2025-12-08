#!/bin/bash
set -euo pipefail

TARGET_URL=${1:-}
if [ -z "$TARGET_URL" ]; then
  echo "Usage: $0 <url>"
  exit 1
fi

echo "Running smoke tests against $TARGET_URL..."

# 1. Shallow Health
curl -fsS "$TARGET_URL/v2/healthz" > /dev/null
echo "   Shallow Health Check Passed"
    
# 2. Deep Health
curl -fsS "$TARGET_URL/v2/healthz?deep=1" > /dev/null
echo "   Deep Health Check Passed"
# 3. Public Config/Docs (Optional)
if curl -fsS "$TARGET_URL/v2/docs" > /dev/null; then
  echo "   Docs endpoint reachable"
else
  echo "   Docs missing (Optional)"
fi

echo "🚀 All Smoke Tests Passed!"
