#!/bin/bash
set -e

PUID=${PUID:-1000}
PGID=${PGID:-1000}

# Create or reuse group with target GID
GROUP_NAME=$(getent group "$PGID" | cut -d: -f1 || true)
if [ -z "$GROUP_NAME" ]; then
    groupadd -g "$PGID" appgroup
    GROUP_NAME="appgroup"
fi

# Create or reuse user with target UID
USER_NAME=$(getent passwd "$PUID" | cut -d: -f1 || true)
if [ -z "$USER_NAME" ]; then
    useradd -u "$PUID" -g "$GROUP_NAME" -d /app -s /bin/bash -M appuser
    USER_NAME="appuser"
elif [ "$USER_NAME" != "appuser" ]; then
    # UID exists under a different name — reuse it
    USER_NAME="$USER_NAME"
fi

# Set permissions on data directory
chown -R "$PUID":"$PGID" /app/data

echo "──────────────────────────────────"
echo "  Keepomat Container"
echo "  UID: $PUID | GID: $PGID"
echo "──────────────────────────────────"

# Run as target UID
exec gosu "$PUID" "$@"
