#!/usr/bin/env bash
# Vanguard Outdoor — local installation (macOS / Linux / WSL)
# Installs dependencies, prepares PostgreSQL, writes .env files, runs migrations + seed.
set -euo pipefail
cd "$(dirname "$0")/.."
bold() { printf "\033[1m%s\033[0m\n" "$*"; }

bold "1/5 · Checking prerequisites"
command -v node >/dev/null || { echo "Node.js ≥ 20 is required (https://nodejs.org)"; exit 1; }
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
[ "$NODE_MAJOR" -ge 20 ] || { echo "Node.js ≥ 20 required (found $(node -v))"; exit 1; }
echo "  node $(node -v), npm $(npm -v)"

bold "2/5 · Installing CLIs (Vercel, Railway)"
command -v vercel >/dev/null || npm i -g vercel
command -v railway >/dev/null || npm i -g @railway/cli
echo "  vercel $(vercel --version 2>/dev/null | tail -1) · $(railway --version)"

bold "3/5 · Installing dependencies"
npm --prefix apps/api install
npm --prefix apps/web install

bold "4/5 · Environment files"
[ -f apps/api/.env ] || { cp apps/api/.env.example apps/api/.env; sed -i.bak "s|^JWT_SECRET=.*|JWT_SECRET=$(node -e 'console.log(require("crypto").randomBytes(48).toString("hex"))')|" apps/api/.env && rm -f apps/api/.env.bak; echo "  created apps/api/.env"; }
[ -f apps/web/.env.local ] || { cp apps/web/.env.example apps/web/.env.local; echo "  created apps/web/.env.local"; }

bold "5/5 · Database"
DB_URL=$(grep '^DATABASE_URL=' apps/api/.env | cut -d= -f2-)
if ! node -e "const {Client}=require('./apps/api/node_modules/pg');const c=new Client({connectionString:process.argv[1]});c.connect().then(()=>c.end()).catch(()=>process.exit(1))" "$DB_URL" 2>/dev/null; then
  if command -v docker >/dev/null; then
    echo "  starting PostgreSQL with Docker…"
    docker compose up -d db
    for i in $(seq 1 30); do docker compose exec -T db pg_isready -U vanguard >/dev/null 2>&1 && break; sleep 1; done
  else
    echo "  ✖ PostgreSQL unreachable at $DB_URL — install Postgres 16 or Docker, then re-run."; exit 1
  fi
fi
npm --prefix apps/api run seed

bold "✔ Ready. Start everything with:  npm run dev"
echo "  Store:  http://localhost:3000   ·   API: http://localhost:4000/health"
echo "  Admin:  admin@vanguard.local / Admin1234!  (development only)"
