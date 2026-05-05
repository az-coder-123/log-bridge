#!/bin/bash
# stop.sh — Stop Log Bridge server gracefully

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

PORT="${PORT:-3000}"
STOPPED=0

# ── 1. Stop via PID file (started with start.sh) ──────────────
PID_FILE="$SCRIPT_DIR/.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")

    if kill -0 "$PID" 2>/dev/null; then
        echo "🛑 Stopping Log Bridge (PID: $PID)..."
        kill -TERM "$PID"

        # Wait up to 10 seconds for graceful shutdown
        for i in $(seq 1 10); do
            if ! kill -0 "$PID" 2>/dev/null; then
                echo "✅ Log Bridge stopped gracefully."
                STOPPED=1
                break
            fi
            sleep 1
        done

        # Force kill if still running
        if [ "$STOPPED" -eq 0 ]; then
            echo "⏱️  Graceful shutdown timed out. Force killing..."
            kill -9 "$PID" 2>/dev/null
            echo "✅ Log Bridge force stopped."
            STOPPED=1
        fi
    else
        echo "⚠️  Process $PID is not running."
    fi

    rm -f "$PID_FILE"
fi

# ── 2. Kill any remaining process on port 3000 ────────────────
ORPHANS=$(lsof -i :"$PORT" -t 2>/dev/null)

if [ -n "$ORPHANS" ]; then
    echo "🧹 Found orphan process(es) on port $PORT, stopping..."
    for OPID in $ORPHANS; do
        echo "   Killing orphan PID: $OPID"
        kill -9 "$OPID" 2>/dev/null
    done
    STOPPED=1
fi

# ── 3. Final check ────────────────────────────────────────────
if [ "$STOPPED" -eq 0 ]; then
    echo "⚠️  Log Bridge is not running."
else
    # Verify port is free
    sleep 1
    REMAINING=$(lsof -i :"$PORT" -t 2>/dev/null)
    if [ -z "$REMAINING" ]; then
        echo "✅ Port $PORT is now free."
    else
        echo "⚠️  Port $PORT is still in use! Check manually."
    fi
fi