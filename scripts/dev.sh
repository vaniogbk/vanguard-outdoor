#!/usr/bin/env bash
# Runs API (:4000) and storefront (:3000) together; Ctrl+C stops both.
set -euo pipefail
cd "$(dirname "$0")/.."
trap 'kill 0' EXIT
npm --prefix apps/api run dev &
npm --prefix apps/web run dev &
wait
