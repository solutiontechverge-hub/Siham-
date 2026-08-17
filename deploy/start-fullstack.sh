#!/bin/sh
set -e

cd /app/backend
HOST=0.0.0.0 PORT=5000 node src/index.js &

cd /app/frontend
HOSTNAME=0.0.0.0 PORT=3000 npm start &

wait -n