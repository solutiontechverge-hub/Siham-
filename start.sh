#!/usr/bin/env bash
set -euo pipefail

cd frontend

# Install dependencies if missing (safe for CI)
if [ ! -d "node_modules" ]; then
  npm ci || npm install
fi

npm run build
npm run start

