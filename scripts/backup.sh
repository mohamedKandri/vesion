#!/usr/bin/env sh
# Manual database backup helper for the production stack.
#   ./scripts/backup.sh            → dump into ./backups
#   ./scripts/backup.sh restore FILE → restore a dump (DESTRUCTIVE, asks first)
set -eu

COMPOSE="docker compose -f docker-compose.prod.yml"
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

if [ "${1:-}" = "restore" ]; then
  FILE="${2:?Usage: backup.sh restore <file.dump>}"
  printf 'This will OVERWRITE the current database with %s. Type "yes" to continue: ' "$FILE"
  read -r answer
  [ "$answer" = "yes" ] || { echo "Aborted."; exit 1; }
  $COMPOSE exec -T postgres pg_restore -U "${POSTGRES_USER:-vesion}" -d "${POSTGRES_DB:-vesion}" \
    --clean --if-exists < "$FILE"
  echo "Restore complete."
  exit 0
fi

STAMP=$(date +%Y%m%d-%H%M%S)
OUT="$BACKUP_DIR/vesion-manual-$STAMP.dump"
$COMPOSE exec -T postgres pg_dump -U "${POSTGRES_USER:-vesion}" -Fc "${POSTGRES_DB:-vesion}" > "$OUT"
echo "Backup written to $OUT"
