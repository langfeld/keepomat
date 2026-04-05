#!/bin/bash
set -e

PUID=${PUID:-1000}
PGID=${PGID:-1000}

# Gruppe erstellen/anpassen
if ! getent group appgroup > /dev/null 2>&1; then
    groupadd -g "$PGID" appgroup
else
    groupmod -g "$PGID" appgroup
fi

# Benutzer erstellen/anpassen
if ! id appuser > /dev/null 2>&1; then
    useradd -u "$PUID" -g appgroup -d /app -s /bin/bash appuser
else
    usermod -u "$PUID" -g "$PGID" appuser
fi

# Berechtigungen setzen
chown -R appuser:appgroup /app/data

echo "──────────────────────────────────"
echo "  Keepomat Container"
echo "  UID: $PUID | GID: $PGID"
echo "──────────────────────────────────"

# Als appuser ausführen
exec gosu appuser "$@"
