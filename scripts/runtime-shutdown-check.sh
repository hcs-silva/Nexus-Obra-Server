#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <server-pid>"
  exit 1
fi

SERVER_PID="$1"
TIMEOUT_SECONDS="${2:-12}"

echo "Sending SIGTERM to process ${SERVER_PID}"
kill -TERM "${SERVER_PID}"

start_time="$(date +%s)"
while kill -0 "${SERVER_PID}" 2>/dev/null; do
  now="$(date +%s)"
  elapsed=$((now - start_time))

  if [[ "${elapsed}" -ge "${TIMEOUT_SECONDS}" ]]; then
    echo "Process ${SERVER_PID} did not exit within ${TIMEOUT_SECONDS}s"
    exit 1
  fi

  sleep 1
done

echo "Process ${SERVER_PID} exited after SIGTERM"
