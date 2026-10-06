#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Vanguard Outdoor — one-command production deployment
#   Backend + PostgreSQL → Railway   ·   Frontend → Vercel
#
# Usage:
#   export RAILWAY_TOKEN=...      # optional (else interactive `railway login`) — use an *account/team* token
#   export VERCEL_TOKEN=...       # optional (else interactive `vercel login`)
#   export ADMIN_EMAIL=you@domain.eu ADMIN_PASSWORD='a-strong-password'
#   # payments (at least one PSP for production):
#   export ADYEN_API_KEY=... ADYEN_MERCHANT_ACCOUNT=... ADYEN_CLIENT_KEY=... ADYEN_HMAC_KEY=... ADYEN_ENVIRONMENT=test
#   export PAYONEER_MERCHANT_CODE=... PAYONEER_API_TOKEN=...      # optional
#   export SITE_DOMAIN=www.vanguard-outdoor.eu                   # optional custom domain
#   export RAILWAY_PROJECT_ID=...                                # optional: reuse an existing Railway project
#   export THEME=forest                                          # forest (default) | classic (black/white/red)
#   bash scripts/deploy.sh
#
# Re-runnable: existing project/services are reused, variables are updated.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$(pwd)
PROJECT_NAME=${PROJECT_NAME:-vanguard-outdoor}
API_SERVICE=${API_SERVICE:-api}
bold() { printf "\n\033[1;31m▲\033[0m \033[1m%s\033[0m\n" "$*"; }
need() { command -v "$1" >/dev/null || npm i -g "$2"; }

need railway @railway/cli
need vercel vercel
VC_ARGS=(); [ -n "${VERCEL_TOKEN:-}" ] && VC_ARGS+=(--token "$VERCEL_TOKEN")

# ───────── Payment providers to enable ─────────
PROVIDERS=()
[ -n "${ADYEN_API_KEY:-}" ] && PROVIDERS+=(adyen)
[ -n "${PAYONEER_API_TOKEN:-}" ] && PROVIDERS+=(payoneer)
if [ ${#PROVIDERS[@]} -eq 0 ]; then
  echo "⚠  No ADYEN_* or PAYONEER_* credentials exported — checkout will be disabled until you add them."
  PAYMENT_PROVIDERS="adyen"
else
  PAYMENT_PROVIDERS=$(IFS=,; echo "${PROVIDERS[*]}")
fi

# ───────── 1. Railway: project, Postgres, API service ─────────
bold "Railway · authenticating"
railway whoami >/dev/null 2>&1 || railway login

cd "$ROOT/apps/api"
if [ -n "${RAILWAY_PROJECT_ID:-}" ] && ! railway status >/dev/null 2>&1; then
  railway link --project "$RAILWAY_PROJECT_ID"
fi
if ! railway status >/dev/null 2>&1; then
  bold "Railway · creating project $PROJECT_NAME"
  railway init --name "$PROJECT_NAME"
fi
if ! railway variable list --service Postgres --kv >/dev/null 2>&1; then
  bold "Railway · adding PostgreSQL"
  railway add --database postgres
fi
if ! railway variable list --service "$API_SERVICE" --kv >/dev/null 2>&1; then
  bold "Railway · creating service $API_SERVICE"
  railway add --service "$API_SERVICE"
fi

JWT_SECRET=${JWT_SECRET:-$(node -e 'console.log(require("crypto").randomBytes(48).toString("hex"))')}
EXISTING_JWT=$(railway variable list --service "$API_SERVICE" --kv 2>/dev/null | grep '^JWT_SECRET=' | cut -d= -f2- || true)
[ -n "$EXISTING_JWT" ] && JWT_SECRET=$EXISTING_JWT   # never rotate on re-deploy (would log everyone out)

# Payoneer notifications need their own random secret (the provider and its webhook stay disabled without it).
# Generated once, then kept stable across re-deploys.
if [ -n "${PAYONEER_API_TOKEN:-}" ] && [ -z "${PAYONEER_NOTIFICATION_SECRET:-}" ]; then
  EXISTING_PNS=$(railway variable list --service "$API_SERVICE" --kv 2>/dev/null | grep '^PAYONEER_NOTIFICATION_SECRET=' | cut -d= -f2- || true)
  PAYONEER_NOTIFICATION_SECRET=${EXISTING_PNS:-$(node -e 'console.log(require("crypto").randomBytes(24).toString("hex"))')}
fi

bold "Railway · generating public domain"
API_DOMAIN=$(railway domain --service "$API_SERVICE" --json 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const d=j.domain||j.domains?.[0]?.domain||j[0]?.domain||"";console.log(String(d).replace(/^https?:\/\//,""))}catch{console.log("")}})')
if [ -z "$API_DOMAIN" ]; then
  API_DOMAIN=$(railway domain --service "$API_SERVICE" 2>&1 | grep -oE '[a-z0-9.-]+\.up\.railway\.app' | head -1 || true)
fi
[ -n "$API_DOMAIN" ] || { echo "Could not read the Railway domain — run 'railway domain --service $API_SERVICE' and set API_DOMAIN=..."; exit 1; }
API_URL="https://$API_DOMAIN"
echo "  API → $API_URL"

FRONTEND_URL=${SITE_DOMAIN:+https://$SITE_DOMAIN}
FRONTEND_URL=${FRONTEND_URL:-https://$PROJECT_NAME.vercel.app}

set_api_vars() {
  local vars=(
    "NODE_ENV=production"
    'DATABASE_URL=${{Postgres.DATABASE_URL}}'
    "JWT_SECRET=$JWT_SECRET"
    "PUBLIC_API_URL=$API_URL"
    "FRONTEND_URL=$FRONTEND_URL"
    "CORS_ORIGINS=$CORS_ORIGINS"
    "PAYMENT_PROVIDERS=$PAYMENT_PROVIDERS"
    "FX_USD_EUR=${FX_USD_EUR:-0.86}"
    "PRICE_MULTIPLIER=${PRICE_MULTIPLIER:-1}"
  )
  for k in ADMIN_EMAIL ADMIN_PASSWORD ADYEN_ENVIRONMENT ADYEN_API_KEY ADYEN_MERCHANT_ACCOUNT ADYEN_CLIENT_KEY ADYEN_HMAC_KEY ADYEN_LIVE_PREFIX \
           PAYONEER_BASE_URL PAYONEER_MERCHANT_CODE PAYONEER_API_TOKEN PAYONEER_DIVISION PAYONEER_NOTIFICATION_SECRET; do
    [ -n "${!k:-}" ] && vars+=("$k=${!k}")
  done
  railway variable set --service "$API_SERVICE" --skip-deploys "${vars[@]}" >/dev/null
}
CORS_ORIGINS="$FRONTEND_URL"
bold "Railway · setting variables"
set_api_vars

bold "Railway · deploying API (Dockerfile)"
railway up --service "$API_SERVICE" --detach --ci

# ───────── 2. Vercel: frontend ─────────
cd "$ROOT/apps/web"
bold "Vercel · authenticating & linking"
[ -n "${VERCEL_TOKEN:-}" ] || vercel whoami >/dev/null 2>&1 || vercel login
vercel link --yes --project "$PROJECT_NAME" "${VC_ARGS[@]}" >/dev/null

for target in production preview; do
  vercel env add NEXT_PUBLIC_API_URL "$target" --value "$API_URL" --force --yes "${VC_ARGS[@]}" >/dev/null
  vercel env add NEXT_PUBLIC_SITE_URL "$target" --value "$FRONTEND_URL" --force --yes "${VC_ARGS[@]}" >/dev/null
  vercel env add NEXT_PUBLIC_THEME "$target" --value "${THEME:-forest}" --force --yes "${VC_ARGS[@]}" >/dev/null
done

bold "Vercel · deploying to production"
DEPLOY_URL=$(vercel deploy --prod --yes "${VC_ARGS[@]}" | tail -1)
echo "  deployment → $DEPLOY_URL"
if [ -n "${SITE_DOMAIN:-}" ]; then
  vercel domains add "$SITE_DOMAIN" "${VC_ARGS[@]}" || true
fi

# ───────── 3. Close the loop: allow the real frontend origin(s) on the API ─────────
CORS_ORIGINS="$FRONTEND_URL,https://$PROJECT_NAME.vercel.app"
cd "$ROOT/apps/api"
set_api_vars
railway variable set --service "$API_SERVICE" "CORS_ORIGINS=$CORS_ORIGINS" >/dev/null   # triggers redeploy

# ───────── 4. Smoke test ─────────
bold "Smoke test"
for i in $(seq 1 30); do
  if curl -fsS "$API_URL/health" >/dev/null 2>&1; then echo "  ✔ API healthy"; break; fi
  sleep 10
done

cat <<INFO

────────────────────────────────────────────────────────────────────
 ✔ Vanguard Outdoor deployed
   Storefront : $FRONTEND_URL
   API        : $API_URL/health
   Admin      : $FRONTEND_URL/fr/admin   (${ADMIN_EMAIL:-set ADMIN_EMAIL/ADMIN_PASSWORD and re-run})
                Once you have logged in, delete ADMIN_PASSWORD from the Railway variables (only needed for the first start).

 Configure payment webhooks:
   Adyen    → Customer Area › Developers › Webhooks › Standard webhook
              URL  : $API_URL/api/webhooks/adyen   (JSON, HMAC key = ADYEN_HMAC_KEY)
              Allowed origins (Developers › API credentials › Client settings): $FRONTEND_URL
   Payoneer → notification URL is sent automatically with every payment session
              ($API_URL/api/webhooks/payoneer)

 Full catalogue sync: Admin › Produits › « Synchroniser les catalogues »
────────────────────────────────────────────────────────────────────
INFO
