import fs from "node:fs";
import path from "node:path";
import { APP_CONFIG } from "../config/index.js";
import type { LogEntry } from "../types/log.js";

let writeStream: fs.WriteStream | null = null;

/**
 * Initialize the log file directory and create the write stream.
 * Must be called once at server startup before any writes.
 */
export function initLogFile(): void {
  const dir = path.resolve(APP_CONFIG.logs.dir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filePath = path.resolve(APP_CONFIG.logs.file);
  writeStream = fs.createWriteStream(filePath, { flags: "a", encoding: "utf-8" });

  writeStream.on("error", (err: Error) => {
    console.error(`[FileLog] Write stream error: ${err.message}`);
  });
}

/**
 * Append a JSON-formatted log line to the log file using a non-blocking stream.
 * Each line is a self-contained JSON object (NDJSON format).
 */
export function writeToFile(entry: LogEntry): void {
  if (!writeStream) {
    console.error("[FileLog] Write stream not initialized. Call initLogFile() first.");
    return;
  }

  const logLine = JSON.stringify({
    timestamp: entry.timestamp,
    level: entry.level,
    context: entry.context,
    device: entry.device_info.deviceName,
    platform: entry.device_info.platform,
    payload: entry.payload,
  });

  writeStream.write(logLine + "\n");
}

/**
 * Close the write stream gracefully. Call during server shutdown.
 */
export function closeLogFile(): Promise<void> {
  return new Promise((resolve) => {
    if (!writeStream) {
      resolve();
      return;
    }
    writeStream.end(() => {
      writeStream = null;
      resolve();
    });
  });
}