# AGENTS.md — Log Bridge Server

## Project Overview

Log Bridge is a local Express + TypeScript server that receives log entries from Flutter applications over the network. It provides:

- **REST API** to ingest logs (`POST /api/logs`)
- **Pretty terminal output** with color-coded log levels (via `chalk`)
- **File persistence** in NDJSON format (`logs/app.log`)
- **Auto-discovery** via mDNS/Bonjour so Flutter apps can find the server on LAN

---

## Tech Stack

| Layer        | Technology         |
|--------------|--------------------|
| Runtime      | Node.js (ESM)      |
| Language     | TypeScript 5.x     |
| Framework    | Express 5          |
| CORS         | `cors` middleware   |
| Colors       | `chalk` 5 (ESM)    |
| mDNS         | `bonjour-service`  |
| Dev Runner   | `tsx` (hot-reload) |

---

## Project Structure

```
log-bridge/
├── src/
│   ├── server.ts                  # Entry point — starts HTTP server + mDNS
│   ├── app.ts                     # Express app factory (middleware + routes)
│   ├── config/
│   │   └── index.ts               # App config (port, CORS, mDNS, log paths)
│   ├── types/
│   │   └── log.ts                 # TypeScript interfaces (LogEntry, DeviceInfo, etc.)
│   ├── routes/
│   │   └── logRoutes.ts           # Route definitions (/api/health, /api/logs)
│   ├── controllers/
│   │   └── logController.ts       # Request handlers (validation, orchestration)
│   ├── services/
│   │   ├── logger.ts              # Terminal pretty-print with chalk colors
│   │   ├── fileLogService.ts      # Append JSON log lines to file
│   │   └── discoveryService.ts    # mDNS/Bonjour service advertisement
│   └── middlewares/
│       └── errorHandler.ts        # Global error handler middleware
├── logs/                          # Runtime log output (gitignored)
├── package.json
├── tsconfig.json
└── AGENTS.md
```

---

## API Endpoints

### `POST /api/logs`

Receives a log entry from a Flutter client.

**Request Body (JSON):**

```json
{
  "device_info": {
    "deviceName": "Pixel 7",
    "osVersion": "Android 14",
    "appVersion": "1.2.0",
    "platform": "android",
    "deviceId": "abc123"
  },
  "level": "info",
  "timestamp": "2025-05-05T14:30:00.000Z",
  "context": "AuthService",
  "payload": { "message": "User logged in", "userId": 42 }
}
```

**Required fields:** `device_info`, `level`, `timestamp`

**Response:** `200 { "success": true, "message": "Log received successfully." }`

### `GET /api/health`

Health check endpoint.

**Response:** `200 { "success": true, "message": "Server is running.", "data": { "status": "ok", "uptime": 123.45 } }`

---

## Log Levels

| Level     | Terminal Color   |
|-----------|------------------|
| `verbose` | Gray             |
| `debug`   | Cyan             |
| `info`    | Green            |
| `warning` | Yellow           |
| `error`   | Red              |
| `fatal`   | Bold White on Red |

---

## Commands

```bash
# Development (hot-reload)
npm run dev

# Production build
npm run build

# Production start
npm start
```

---

## Architecture Principles

1. **Single Responsibility**: Each module has one job — routes define endpoints, controllers handle requests, services contain business logic.
2. **Separation of Concerns**: Terminal output (`logger.ts`) and file persistence (`fileLogService.ts`) are separate services.
3. **Error Handling**: All controller errors are caught with try/catch and forwarded to the global `errorHandler` middleware.
4. **Type Safety**: All log payloads are typed via `src/types/log.ts` interfaces.
5. **Graceful Shutdown**: SIGINT/SIGTERM signals stop mDNS advertising before closing the HTTP server.

---

## mDNS Auto-Discovery

The server advertises itself as `_http._tcp` service named `FlutterLogServer` on the local network. Flutter apps can use `nsd_flutter` or `bonsoir` packages to discover the service and obtain the server's IP and port automatically.

---

## Environment Variables

| Variable | Default     | Description            |
|----------|-------------|------------------------|
| `PORT`   | `3000`      | Server port            |
| `HOST`   | `0.0.0.0`   | Bind address           |