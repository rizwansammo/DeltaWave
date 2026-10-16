#!/usr/bin/env bash
# DeltaWave backups: database dump and media archive, kept 14 days in
# /opt/DeltaWave/backups (root only). Touches only the DeltaWave stack.
# Copy the newest files off the server regularly (see docs/PHASE3_REPORT.md).
set -euo pipefail
umask 077
cd /opt/DeltaWave
dest=/opt/DeltaWave/backups
mkdir -p "$dest"
stamp=$(date -u +%Y%m%dT%H%M%SZ)

docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner' \
  > "$dest/db-$stamp.dump.partial"
mv "$dest/db-$stamp.dump.partial" "$dest/db-$stamp.dump"

docker run --rm --network none \
  -v deltawave_media:/media:ro -v "$dest":/backup \
  postgres:18.6-alpine3.24 tar -czf "/backup/media-$stamp.tgz.partial" -C /media .
mv "$dest/media-$stamp.tgz.partial" "$dest/media-$stamp.tgz"

find "$dest" -maxdepth 1 \( -name 'db-*.dump' -o -name 'media-*.tgz' \) -mtime +14 -delete
echo "$(date -u +%FT%TZ) backup ok: db-$stamp.dump media-$stamp.tgz"
