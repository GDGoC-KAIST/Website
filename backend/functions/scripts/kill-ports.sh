#!/usr/bin/env bash

set -euo pipefail

PORTS=(
  5001 # Functions
  8080 # Firestore
  8085 # Pub/Sub
  9099 # Auth
)

kill_port() {
  local port=$1
  local pids
  if ! command -v lsof >/dev/null 2>&1; then
    echo "lsof not found; skipping port cleanup."
    return
  fi

  pids=$(lsof -ti tcp:"${port}" || true)
  if [[ -n "${pids}" ]]; then
    echo "Killing processes on port ${port}: ${pids}"
    # shellcheck disable=SC2086
    kill -9 ${pids} || true
  else
    echo "No processes found on port ${port}"
  fi
}

for port in "${PORTS[@]}"; do
  kill_port "${port}"
done
