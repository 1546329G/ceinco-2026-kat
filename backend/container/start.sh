#!/usr/bin/env bash
set -euo pipefail

mkdir -p uploads
chown nobody uploads

if [[ "${DB_ENGINE:-mariadb}" == postgres ]]; then
    exec gosu nobody node server.js
fi

export DB_NAME="${MARIADB_DATABASE:?}"
export DB_USER="${MARIADB_USER:?}"
export DB_PASSWORD="${MARIADB_PASSWORD:?}"

db_pid=
app_pid=
shutdown() {
    trap - EXIT TERM INT
    if [[ -n "$app_pid" ]]; then kill -TERM "$app_pid" 2>/dev/null || true; fi
    if [[ -n "$db_pid" ]]; then kill -TERM "$db_pid" 2>/dev/null || true; fi
    wait || true
}
trap shutdown EXIT
trap 'exit 0' TERM INT

docker-entrypoint.sh mariadbd --bind-address=127.0.0.1 &
db_pid=$!
until MYSQL_PWD="$DB_PASSWORD" mariadb --protocol=TCP -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" -e 'SELECT 1 FROM USUARIOS LIMIT 0' >/dev/null 2>&1; do
    kill -0 "$db_pid"
    sleep 1
done

MYSQL_PWD="$DB_PASSWORD" mariadb --protocol=TCP -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" < container/upgrade.sql

gosu nobody node server.js &
app_pid=$!
wait -n "$db_pid" "$app_pid"
exit 1
