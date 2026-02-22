#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-5055}"
BASE_URL="${BASE_URL:-http://localhost:${PORT}}"
TOKEN_SECRET="${TOKEN_SECRET:-test-secret}"
MONGODB_URI="${MONGODB_URI:-mongodb://127.0.0.1:27017/gestao-obra-server}"
AUTH_RATE_LIMIT_MAX="${AUTH_RATE_LIMIT_MAX:-100}"

SERVER_PID=""

cleanup() {
  if [[ -n "${SERVER_PID}" ]] && kill -0 "${SERVER_PID}" 2>/dev/null; then
    kill "${SERVER_PID}" 2>/dev/null || true
    wait "${SERVER_PID}" 2>/dev/null || true
  fi
  rm -f ./tmp-smoke-token.txt
}

trap cleanup EXIT

echo "[smoke] Building project..."
pnpm build >/dev/null

echo "[smoke] Starting server..."
PORT="${PORT}" TOKEN_SECRET="${TOKEN_SECRET}" MONGODB_URI="${MONGODB_URI}" AUTH_RATE_LIMIT_MAX="${AUTH_RATE_LIMIT_MAX}" pnpm start >/tmp/smoke-server.log 2>&1 &
SERVER_PID=$!

for _ in {1..30}; do
  if curl -s "${BASE_URL}/api" >/dev/null; then
    break
  fi
  sleep 1
done

if ! curl -s "${BASE_URL}/api" >/dev/null; then
  echo "[smoke] FAIL: server did not become ready"
  echo "[smoke] Server log:"
  cat /tmp/smoke-server.log || true
  exit 1
fi

node -e "const fs=require('fs'); const jwt=require('jsonwebtoken'); fs.writeFileSync('./tmp-smoke-token.txt', jwt.sign({role:'Admin',clientId:'65f000000000000000000001'}, process.env.TOKEN_SECRET || 'test-secret'));"
AUTH_TOKEN=$(cat ./tmp-smoke-token.txt)

assert_status() {
  local expected="$1"
  local label="$2"
  local method="$3"
  local path="$4"
  local body="${5:-}"
  local auth="${6:-no}"

  local cmd=(curl -s -o /tmp/smoke-body.out -w "%{http_code}" -X "${method}" "${BASE_URL}${path}" -H "Content-Type: application/json")
  if [[ "${auth}" == "yes" ]]; then
    cmd+=( -H "Authorization: Bearer ${AUTH_TOKEN}" )
  fi
  if [[ -n "${body}" ]]; then
    cmd+=( -d "${body}" )
  fi

  local status
  status=$("${cmd[@]}")

  if [[ "${status}" != "${expected}" ]]; then
    echo "[smoke] FAIL: ${label} (expected ${expected}, got ${status})"
    cat /tmp/smoke-body.out || true
    exit 1
  fi

  echo "[smoke] PASS: ${label} => ${status}"
}

assert_status "200" "GET /api" "GET" "/api"
assert_status "401" "GET /users unauthenticated" "GET" "/users"
assert_status "400" "POST /users/login invalid body" "POST" "/users/login" "{}"
assert_status "400" "POST /users/signup invalid body (authenticated)" "POST" "/users/signup" "{}" "yes"
assert_status "400" "POST /clients/createClient invalid body (authenticated)" "POST" "/clients/createClient" "{}" "yes"
assert_status "400" "POST /obras/createObra invalid body (authenticated)" "POST" "/obras/createObra" "{}" "yes"
assert_status "400" "PATCH /users/resetpassword invalid body (authenticated)" "PATCH" "/users/resetpassword/65f000000000000000000002" "{}" "yes"
assert_status "400" "PATCH /clients/me invalid body (authenticated)" "PATCH" "/clients/me" "{}" "yes"
assert_status "400" "PATCH /obras/:obraId invalid body (authenticated)" "PATCH" "/obras/65f000000000000000000003" "{}" "yes"

echo "[smoke] All checks passed."
