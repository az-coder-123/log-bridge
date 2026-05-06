# 🌉 Log Bridge

A local Express + TypeScript server that receives log entries from Flutter applications over the network. Provides pretty terminal output, file persistence, and auto-discovery via mDNS.

---

## ✨ Features

- **REST API** — Receive logs from Flutter apps via `POST /api/logs`
- **Pretty Terminal Output** — Color-coded log levels with `chalk`
- **File Persistence** — Logs saved in NDJSON format (`logs/app.log`)
- **Auto-Discovery** — mDNS/Bonjour advertisement so Flutter apps find the server automatically
- **CORS Enabled** — Accepts connections from any device on the LAN
- **Graceful Shutdown** — Clean teardown of mDNS and HTTP server on SIGINT/SIGTERM
- **Hot-Reload** — Development with `tsx watch`

---

## 📸 Dashboard

![Log Bridge Dashboard](screenshots/board-01.png)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server (hot-reload)
npm run dev

# Production build
npm run build

# Start production server
npm start
```

The server starts on `http://0.0.0.0:3000` by default.

---

## 📡 API Endpoints

### `POST /api/logs`

Receive a log entry from a Flutter client.

**Request Body:**

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

| Field         | Type     | Required | Description                  |
|---------------|----------|----------|------------------------------|
| `device_info` | object   | ✅       | Device metadata              |
| `level`       | string   | ✅       | Log level                    |
| `timestamp`   | string   | ✅       | ISO 8601 timestamp           |
| `context`     | string   | ❌       | Source context/module name    |
| `payload`     | any      | ❌       | Arbitrary log data           |

**Response:** `200 OK`

```json
{ "success": true, "message": "Log received successfully." }
```

### `GET /api/health`

Health check endpoint.

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Server is running.",
  "data": { "status": "ok", "uptime": 123.45 }
}
```

---

## 🎨 Log Levels

| Level     | Color             |
|-----------|-------------------|
| `verbose` | ⬜ Gray           |
| `debug`   | 🟦 Cyan          |
| `info`    | 🟩 Green         |
| `warning` | 🟨 Yellow        |
| `error`   | 🟥 Red           |
| `fatal`   | ⬜🔴 Bold White on Red |

---

## 📂 Project Structure

```
log-bridge/
├── src/
│   ├── server.ts                  # Entry point — HTTP server + mDNS
│   ├── app.ts                     # Express app factory
│   ├── config/index.ts            # Configuration (port, CORS, mDNS)
│   ├── types/log.ts               # TypeScript interfaces
│   ├── routes/logRoutes.ts        # Route definitions
│   ├── controllers/logController.ts  # Request handlers
│   ├── services/
│   │   ├── logger.ts              # Terminal pretty-print
│   │   ├── fileLogService.ts      # File persistence (NDJSON)
│   │   └── discoveryService.ts    # mDNS/Bonjour advertisement
│   └── middlewares/errorHandler.ts # Global error handler
├── logs/                          # Runtime log output (gitignored)
├── package.json
├── tsconfig.json
└── AGENTS.md
```

---

## 📡 mDNS Auto-Discovery

The server advertises itself as `_http._tcp` named `FlutterLogServer` on the local network. Flutter apps can discover it using:

- **[`nsd_flutter`](https://pub.dev/packages/nsd_flutter)** — Network Service Discovery
- **[`bonsoir`](https://pub.dev/packages/bonsoir)** — Cross-platform mDNS discovery

---

## ⚙️ Configuration

| Environment Variable | Default     | Description          |
|----------------------|-------------|----------------------|
| `PORT`               | `3000`      | Server port          |
| `HOST`               | `0.0.0.0`   | Bind address         |

---

## 📄 License

[MIT](LICENSE)