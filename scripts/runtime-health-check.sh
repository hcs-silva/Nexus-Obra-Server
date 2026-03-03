#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:5005}"
HEALTH_URL="${BASE_URL}/api/health"

echo "Checking ${HEALTH_URL}"
status_code="$(curl -s -o /tmp/nexus_obra_health_response.json -w "%{http_code}" "${HEALTH_URL}")"

if [[ "${status_code}" -ne 200 && "${status_code}" -ne 503 ]]; then
  echo "Health check failed with status ${status_code}"
  cat /tmp/nexus_obra_health_response.json
  exit 1
fi

echo "Health endpoint responded with status ${status_code}"
cat /tmp/nexus_obra_health_response.json
