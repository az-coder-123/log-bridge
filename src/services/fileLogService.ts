import fs from "node:fs";
import path from "node:path";
import { APP_CONFIG } from "../config/index.js";
import type { LogEntry } from "../types/log.js";

/**
 * Ensures the log directory exists, creating it if necessary.
 */
function ensureLogDirectory(): void {
  const dir = path.resolve(APP_CONFIG.logs.dir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Append a JSON-formatted log line to the log file.
 * Each line is a self-contained JSON object (NDJSON format).
 */
export function writeToFile(entry: LogEntry): void {
  ensureLogDirectory();

  const logLine = JSON.stringify({
    timestamp: entry.timestamp,
    level: entry.level,
    context: entry.context,
    device: entry.device_info.deviceName,
    platform: entry.device_info.platform,
    payload: entry.payload,
  });

  const filePath = path.resolve(APP_CONFIG.logs.file);
  fs.appendFileSync(filePath, logLine + "\n", "utf-8");
}