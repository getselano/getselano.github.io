#!/usr/bin/env bash
# Runs the RLS tests against a throwaway local Postgres cluster.
# Needs Postgres binaries (initdb, pg_ctl) on the machine.
set -euo pipefail
cd "$(dirname "$0")/.."
PGBIN=${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}
DIR=$(mktemp -d)
PORT=${PGPORT_TEST:-54329}
RUN=()
if [ "$(id -u)" = 0 ]; then chown postgres "$DIR"; RUN=(runuser -u postgres --); fi
"${RUN[@]}" "$PGBIN/initdb" -D "$DIR/data" -U postgres -A trust >/dev/null
"${RUN[@]}" "$PGBIN/pg_ctl" -D "$DIR/data" -o "-p $PORT -k $DIR" -l "$DIR/log" -w start >/dev/null
trap '"${RUN[@]}" "$PGBIN/pg_ctl" -D "$DIR/data" -m immediate stop >/dev/null; rm -rf "$DIR"' EXIT
RLS_DATABASE_URL="postgres://postgres@localhost:$PORT/postgres" npx vitest run tests/rls.test.ts
