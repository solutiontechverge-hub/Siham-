#!/bin/sh
set -e

cd /app/backend
HOST=0.0.0.0 PORT=5000 node src/index.js &
BACKEND_PID=$!

cd /app/frontend
HOSTNAME=0.0.0.0 PORT=3000 npm start &
FRONTEND_PID=$!

# dash/ash have no wait -n; exit when either process dies.
while kill -0 "$BACKEND_PID" 2>/dev/null && kill -0 "$FRONTEND_PID" 2>/dev/null; do
  sleep 1
done

if kill -0 "$BACKEND_PID" 2>/dev/null; then
  wait "$FRONTEND_PID"
  exit $?
fi
wait "$BACKEND_PID"
exit $?