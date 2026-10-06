#!/usr/bin/env bash
# Creates (or resets) the shop's ADMIN account on Railway.
# The password is typed here (hidden) and goes straight to Railway through stdin: it never appears in a terminal
# history, in a log or in a chat. The script then checks that the login works and removes ADMIN_PASSWORD again.
#
#   bash scripts/set-admin.sh [admin@example.com]
set -euo pipefail
cd "$(dirname "$0")/../apps/api"

EMAIL=${1:-}
[ -n "$EMAIL" ] || read -rp "Admin e-mail: " EMAIL
read -rsp "Admin password (12+ characters, hidden): " PW; echo
read -rsp "Repeat it: " PW2; echo
[ "$PW" = "$PW2" ] || { echo "The two passwords differ."; exit 1; }
[ "${#PW}" -ge 12 ] || { echo "Use at least 12 characters."; exit 1; }

API_URL=$(railway variable list --service api --kv | grep '^PUBLIC_API_URL=' | cut -d= -f2-)
[ -n "$API_URL" ] || { echo "PUBLIC_API_URL not found on the Railway service 'api' (run 'railway link' in apps/api first)."; exit 1; }

echo "→ sending the credentials to Railway…"
printf '%s' "$PW" | railway variable set ADMIN_PASSWORD --stdin --service api --skip-deploys >/dev/null
railway variable set --service api "ADMIN_EMAIL=$EMAIL" >/dev/null # triggers the redeploy that creates the account

echo "→ waiting for the API to restart (about a minute)…"
ok=""
for _ in $(seq 1 40); do
  sleep 6
  state=$(EMAIL="$EMAIL" PW="$PW" node -e '
    fetch(process.argv[1] + "/api/auth/login", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: process.env.EMAIL, password: process.env.PW }) })
      .then(async (r) => { const j = await r.json().catch(() => ({})); console.log(r.status === 200 && j.user && j.user.role === "admin" ? "ADMIN" : r.status); })
      .catch(() => console.log("down"));
  ' "$API_URL" || true)
  if [ "$state" = "ADMIN" ]; then ok=1; break; fi
done
[ -n "$ok" ] || { echo "✖ The login did not work in time: check the Railway logs (ADMIN_PASSWORD is still set)."; exit 1; }

echo "✔ Admin account ready: $EMAIL"
echo "→ removing ADMIN_PASSWORD from Railway (only needed for the first start)…"
railway variable delete ADMIN_PASSWORD --service api >/dev/null
unset PW PW2
echo "Done. Sign in at your shop: /fr/admin"
