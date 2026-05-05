#!/bin/bash
# start.sh — Build and start Log Bridge server in background

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

PID_FILE="$SCRIPT_DIR/.pid"
LOG_FILE="$SCRIPT_DIR/logs/server.out.log"
PORT="${PORT:-3000}"

# ── 1. Check if port is already in use ────────────────────────
EXISTING=$(lsof -i :"$PORT" -t 2>/dev/null)
if [ -n "$EXISTING" ]; then
    echo "⚠️  Port $PORT is already in use by process(es): $EXISTING"
    echo "   Run './stop.sh' first to stop it."
    exit 1
fi

# ── 2. Check PID file (stale check) ──────────────────────────
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "⚠️  Log Bridge is already running (PID: $OLD_PID)"
        exit 1
    else
        echo "🧹 Cleaning stale PID file..."
        rm -f "$PID_FILE"
    fi
fi

# ── 3. Build ─────────────────────────────────────────────────
echo "🔨 Building project..."
npm run build > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Run 'npm run build' for details."
    exit 1
fi

# ── 4. Start server ──────────────────────────────────────────
mkdir -p logs

echo "🚀 Starting Log Bridge server..."
nohup node dist/server.js > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

echo "$SERVER_PID" > "$PID_FILE"

# Wait and verify
sleep 1
if kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "✅ Log Bridge started successfully (PID: $SERVER_PID)"
    echo "📄 Log output: $LOG_FILE"
    echo "🌐 API: http://localhost:$PORT"
else
    echo "❌ Server failed to start. Check $LOG_FILE for details."
    rm -f "$PID_FILE"
    exit 1
fi