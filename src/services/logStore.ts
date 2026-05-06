import fs from "node:fs";
import type { LogEntry } from "../types/log.js";
import { LogLevel } from "../types/log.js";

const MAX_LOGS = 10_000;

/** Stored log entry with a sequential ID */
export interface StoredLog extends LogEntry {
  id: number;
}

const logs: StoredLog[] = [];
let nextId = 1;

/**
 * Load existing logs from the NDJSON log file into memory.
 * Called once at server startup so the dashboard shows historical data.
 */
export function loadFromFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf-8").trim();
  if (!content) return;

  const lines = content.split("\n").filter(Boolean);
  for (const line of lines) {
    try {
      const raw = JSON.parse(line);
      // Reconstruct a LogEntry from the NDJSON format stored by fileLogService
      const entry: LogEntry = {
        device_info: {
          deviceName: raw.device ?? "Unknown",
          osVersion: raw.osVersion ?? "",
          appVersion: raw.appVersion ?? "",
          platform: raw.platform ?? "",
        },
        level: raw.level,
        timestamp: raw.timestamp,
        context: raw.context,
        payload: raw.payload,
      };
      addLog(entry);
    } catch {
      // Skip malformed lines
    }
  }
}

/**
 * Add a log entry to the in-memory store.
 */
export function addLog(entry: LogEntry): StoredLog {
  const stored: StoredLog = { ...entry, id: nextId++ };
  logs.push(stored);

  // Evict oldest if over limit
  if (logs.length > MAX_LOGS) {
    logs.splice(0, logs.length - MAX_LOGS);
  }

  return stored;
}

/**
 * Query logs with filtering, search, and pagination.
 */
export interface LogQuery {
  level?: LogLevel | LogLevel[];
  search?: string;
  device?: string;
  context?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface LogQueryResult {
  logs: StoredLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function queryLogs(query: LogQuery): LogQueryResult {
  let filtered = [...logs];

  // Filter by level (single or array)
  if (query.level) {
    const levels = Array.isArray(query.level) ? query.level : [query.level];
    const levelSet = new Set(levels);
    filtered = filtered.filter((log) => levelSet.has(log.level));
  }

  // Filter by device name
  if (query.device) {
    const deviceLower = query.device.toLowerCase();
    filtered = filtered.filter((log) =>
      log.device_info.deviceName.toLowerCase().includes(deviceLower)
    );
  }

  // Filter by context
  if (query.context) {
    const contextLower = query.context.toLowerCase();
    filtered = filtered.filter((log) =>
      log.context?.toLowerCase().includes(contextLower)
    );
  }

  // Filter by search term (searches context, payload JSON string, device name)
  if (query.search) {
    const searchLower = query.search.toLowerCase();
    filtered = filtered.filter((log) => {
      const contextMatch = log.context?.toLowerCase().includes(searchLower);
      const deviceMatch = log.device_info.deviceName
        .toLowerCase()
        .includes(searchLower);
      const payloadMatch = JSON.stringify(log.payload)
        .toLowerCase()
        .includes(searchLower);
      return contextMatch || deviceMatch || payloadMatch;
    });
  }

  // Filter by date range
  if (query.startDate) {
    const start = new Date(query.startDate).getTime();
    if (!isNaN(start)) {
      filtered = filtered.filter(
        (log) => new Date(log.timestamp).getTime() >= start
      );
    }
  }
  if (query.endDate) {
    const end = new Date(query.endDate).getTime();
    if (!isNaN(end)) {
      filtered = filtered.filter(
        (log) => new Date(log.timestamp).getTime() <= end
      );
    }
  }

  // Reverse chronological order
  filtered.sort((a, b) => b.id - a.id);

  const total = filtered.length;
  const limit = Math.max(1, Math.min(500, query.limit ?? 50));
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = Math.max(1, Math.min(totalPages, query.page ?? 1));

  const startIdx = (page - 1) * limit;
  const paged = filtered.slice(startIdx, startIdx + limit);

  return { logs: paged, total, page, limit, totalPages };
}

/**
 * Get all unique device names seen so far.
 */
export function getDevices(): string[] {
  const set = new Set<string>();
  for (const log of logs) {
    set.add(log.device_info.deviceName);
  }
  return [...set].sort();
}

/**
 * Get all unique contexts seen so far.
 */
export function getContexts(): string[] {
  const set = new Set<string>();
  for (const log of logs) {
    if (log.context) set.add(log.context);
  }
  return [...set].sort();
}

/**
 * Get log statistics.
 */
export function getStats(): {
  total: number;
  byLevel: Record<string, number>;
  devices: number;
} {
  const byLevel: Record<string, number> = {};
  for (const level of Object.values(LogLevel)) {
    byLevel[level] = 0;
  }
  const devices = new Set<string>();

  for (const log of logs) {
    byLevel[log.level] = (byLevel[log.level] ?? 0) + 1;
    devices.add(log.device_info.deviceName);
  }

  return { total: logs.length, byLevel, devices: devices.size };
}

/**
 * Clear all stored logs.
 */
export function clearLogs(): void {
  logs.length = 0;
}