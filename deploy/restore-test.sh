#!/usr/bin/env bash
# Restore check, installed as /opt/DeltaWave/bin/restore-test.sh: restores the
# newest DeltaWave dump into a throwaway container without network, compares
# row counts with the live database, and removes the container afterwards.
set -euo pipefail
cd /opt/DeltaWave
dump=$(ls -t backups/db-*.dump | head -n 1)
name=deltawave-restore-test
docker ps -a --format '{{.Names}}' | grep -qx "$name" && { echo "$name still exists"; exit 1; }
sql="select format('%s users, %s services, %s solutions, %s media, %s pages, %s migrations, %s enquiries', (select count(*) from users), (select count(*) from services), (select count(*) from solutions), (select count(*) from media), (select count(*) from pages), (select count(*) from payload_migrations), (select count(*) from enquiries))"
docker run -d --rm --name "$name" --network none -e POSTGRES_PASSWORD="$(openssl rand -hex 16)" -v "$PWD/backups":/backup:ro postgres:18.6-alpine3.24 >/dev/null
trap 'docker stop "$name" >/dev/null 2>&1 || true' EXIT
for i in $(seq 1 30); do docker exec "$name" pg_isready -U postgres -q 2>/dev/null && break; sleep 2; done; sleep 2
docker exec "$name" createdb -U postgres restore_check
docker exec "$name" pg_restore -U postgres -d restore_check --no-owner "/backup/$(basename "$dump")"
restored=$(docker exec "$name" psql -U postgres -d restore_check -Atc "$sql")
live=$(docker compose exec -T db psql -U deltawave -d deltawave -Atc "$sql")
echo "dump:     $(basename "$dump")"
echo "restored: $restored"
echo "live:     $live"
[ "$restored" = "$live" ] && echo "RESTORE MATCHES LIVE" || { echo "MISMATCH"; exit 1; }
