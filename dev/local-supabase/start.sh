#!/usr/bin/env bash
# Supabase local para testes (Postgres + PostgREST + Supabase Auth + storage simples), sem Docker.
# Uso:  dev/local-supabase/start.sh          sobe tudo (cria o banco na primeira vez)
#       dev/local-supabase/start.sh reset    apaga o banco local e recria do zero
#       dev/local-supabase/start.sh stop
# Escreve web/.env.test.local com a URL e as chaves locais.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
BIN="${LOCAL_SUPABASE_BIN:-/opt/local-supabase}"
DATA="/var/lib/postgresql/local-supabase"
PG="$(ls -d /usr/lib/postgresql/*/bin | sort -V | tail -1)"
PGPORT=54322
SECRET="local-dev-jwt-secret-with-at-least-32-characters"
LOG="$DATA/logs"

as_pg() { su postgres -c "$*"; }
psql_pg() { as_pg "psql -h 127.0.0.1 -p $PGPORT -U postgres -v ON_ERROR_STOP=1 -q $*"; }

stop() {
  pkill -f "$BIN/postgrest" 2>/dev/null || true
  pkill -f "$BIN/auth/auth" 2>/dev/null || true
  pkill -f "$HERE/proxy.mjs" 2>/dev/null || true
  [ -d "$DATA/pg" ] && as_pg "$PG/pg_ctl -D $DATA/pg -m fast stop" >/dev/null 2>&1 || true
}

download() {
  [ -x "$BIN/postgrest" ] && [ -x "$BIN/auth/auth" ] && return
  mkdir -p "$BIN/auth"
  curl -sSL -o /tmp/pgrst.tar.xz https://github.com/PostgREST/postgrest/releases/download/v13.0.4/postgrest-v13.0.4-linux-static-x86-64.tar.xz
  tar -xJf /tmp/pgrst.tar.xz -C "$BIN"
  curl -sSL -o /tmp/auth.tar.gz https://github.com/supabase/auth/releases/download/v2.180.0/auth-v2.180.0-x86.tar.gz
  tar -xzf /tmp/auth.tar.gz -C "$BIN/auth"
}

wait_http() {
  for _ in $(seq 1 60); do curl -s -o /dev/null "$1" && return 0; sleep 0.5; done
  echo "não respondeu: $1" >&2; return 1
}

case "${1:-start}" in
  stop) stop; exit 0 ;;
  reset) stop; rm -rf "$DATA" ;;
esac

stop
download
mkdir -p "$DATA" "$LOG" "$DATA/storage"
chown -R postgres "$DATA"

fresh=0
if [ ! -d "$DATA/pg" ]; then
  as_pg "$PG/initdb -D $DATA/pg -A trust -U postgres >/dev/null"
  fresh=1
fi
as_pg "$PG/pg_ctl -D $DATA/pg -l $LOG/postgres.log -o '-p $PGPORT -k $DATA -c listen_addresses=127.0.0.1' start >/dev/null"
for _ in $(seq 1 30); do as_pg "$PG/pg_isready -q -h 127.0.0.1 -p $PGPORT" && break; sleep 0.5; done

[ "$fresh" = 1 ] && cp "$HERE/roles.sql" "$DATA/roles.sql" && psql_pg "-f $DATA/roles.sql"

# Auth: na primeira subida cria o schema auth (auth.users, auth.uid()...)
(
  cd "$BIN/auth"
  GOTRUE_DB_DRIVER=postgres \
  DATABASE_URL="postgres://supabase_auth_admin@127.0.0.1:$PGPORT/postgres?sslmode=disable" \
  GOTRUE_DB_NAMESPACE=auth \
  GOTRUE_DB_MIGRATIONS_PATH="$BIN/auth/migrations" \
  GOTRUE_SITE_URL="http://localhost:3000" \
  API_EXTERNAL_URL="http://127.0.0.1:54321/auth/v1" \
  GOTRUE_API_HOST=127.0.0.1 PORT=9999 \
  GOTRUE_JWT_SECRET="$SECRET" GOTRUE_JWT_EXP=3600 GOTRUE_JWT_AUD=authenticated \
  GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated GOTRUE_JWT_ADMIN_ROLES=service_role \
  GOTRUE_DISABLE_SIGNUP=true GOTRUE_MAILER_AUTOCONFIRM=true GOTRUE_EXTERNAL_EMAIL_ENABLED=true \
  GOTRUE_LOG_LEVEL=warn \
  nohup "$BIN/auth/auth" > "$LOG/auth.log" 2>&1 &
)
wait_http http://127.0.0.1:9999/health

if [ "$fresh" = 1 ]; then
  cp "$ROOT/replica/schema.sql" "$DATA/schema.sql"
  chown postgres "$DATA/schema.sql"
  psql_pg "-f $DATA/schema.sql"
fi

cat > "$DATA/postgrest.conf" <<EOF
db-uri = "postgres://authenticator:postgres@127.0.0.1:$PGPORT/postgres"
db-schemas = "public"
db-anon-role = "anon"
jwt-secret = "$SECRET"
server-host = "127.0.0.1"
server-port = 3001
db-pool = 10
EOF
nohup "$BIN/postgrest" "$DATA/postgrest.conf" > "$LOG/postgrest.log" 2>&1 &
wait_http http://127.0.0.1:3001/

JWT_SECRET="$SECRET" STORAGE_DIR="$DATA/storage" nohup node "$HERE/proxy.mjs" > "$LOG/proxy.log" 2>&1 &
wait_http http://127.0.0.1:54321/

eval "$(node "$HERE/keys.mjs" "$SECRET")"
cat > "$ROOT/web/.env.test.local" <<EOF
# Gerado por dev/local-supabase/start.sh. Só para testes locais.
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$ANON_KEY
SUPABASE_SECRET_KEY=$SERVICE_ROLE_KEY
LOCAL_DATABASE_URL=postgres://postgres@127.0.0.1:$PGPORT/postgres
EOF
echo "Supabase local pronto em http://127.0.0.1:54321 (Postgres na porta $PGPORT). Chaves em web/.env.test.local"
