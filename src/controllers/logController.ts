import type { NextFunction, Request, Response } from "express";
import { writeToFile } from "../services/fileLogService.js";
import { prettyPrint } from "../services/logger.js";
import {
  addLog,
  clearLogs,
  getContexts,
  getDevices,
  getStats,
  queryLogs,
} from "../services/logStore.js";
import type { ApiResponse, LogEntry } from "../types/log.js";
import { LogLevel } from "../types/log.js";

const VALID_LEVELS = new Set<string>(Object.values(LogLevel));

/**
 * Validates the incoming log entry has all required fields with correct types.
 */
function validateLogEntry(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Request body must be a JSON object.";
  }

  const entry = body as Record<string, unknown>;

  if (!entry.device_info || typeof entry.device_info !== "object") {
    return "Missing or invalid 'device_info': must be an object.";
  }

  const deviceInfo = entry.device_info as Record<string, unknown>;
  if (!deviceInfo.deviceName || typeof deviceInfo.deviceName !== "string") {
    return "Missing or invalid 'device_info.deviceName': must be a non-empty string.";
  }
  if (!deviceInfo.platform || typeof deviceInfo.platform !== "string") {
    return "Missing or invalid 'device_info.platform': must be a non-empty string.";
  }

  if (!entry.level || typeof entry.level !== "string") {
    return "Missing or invalid 'level': must be a string.";
  }
  if (!VALID_LEVELS.has(entry.level)) {
    return `Invalid 'level': must be one of: ${Object.values(LogLevel).join(", ")}.`;
  }

  if (!entry.timestamp || typeof entry.timestamp !== "string") {
    return "Missing or invalid 'timestamp': must be an ISO 8601 string.";
  }
  if (isNaN(Date.parse(entry.timestamp))) {
    return "Invalid 'timestamp': must be a valid ISO 8601 date string.";
  }

  return null;
}

/**
 * POST /api/logs — Receive a log from Flutter
 */
export function handleLog(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const validationError = validateLogEntry(req.body);
    if (validationError) {
      res.status(400).json(<ApiResponse>{
        success: false,
        message: validationError,
      });
      return;
    }

    const entry = req.body as LogEntry;

    // 1. Store in memory
    addLog(entry);

    // 2. Pretty-print to terminal
    prettyPrint(entry);

    // 3. Persist to file
    writeToFile(entry);

    // 4. Acknowledge
    res.status(200).json(<ApiResponse>{
      success: true,
      message: "Log received successfully.",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/logs — Query logs with filtering, search, pagination
 */
export function handleGetLogs(req: Request, res: Response): void {
  const {
    level,
    search,
    device,
    context,
    startDate,
    endDate,
    page,
    limit,
  } = req.query;

  // Parse level — can be single or comma-separated
  let parsedLevel: LogLevel[] | undefined;
  if (level && typeof level === "string") {
    parsedLevel = level.split(",") as LogLevel[];
  }

  const result = queryLogs({
    level: parsedLevel,
    search: search as string | undefined,
    device: device as string | undefined,
    context: context as string | undefined,
    startDate: startDate as string | undefined,
    endDate: endDate as string | undefined,
    page: page ? parseInt(page as string, 10) : undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined,
  });

  res.status(200).json(<ApiResponse<typeof result>>{
    success: true,
    message: "Logs retrieved.",
    data: result,
  });
}

/**
 * GET /api/logs/stats — Log statistics
 */
export function handleGetStats(_req: Request, res: Response): void {
  const stats = getStats();
  res.status(200).json(<ApiResponse<typeof stats>>{
    success: true,
    message: "Statistics retrieved.",
    data: stats,
  });
}

/**
 * GET /api/logs/filters — Available filter options
 */
export function handleGetFilters(_req: Request, res: Response): void {
  res.status(200).json(
    <ApiResponse<{ levels: string[]; devices: string[]; contexts: string[] }>>{
      success: true,
      message: "Filters retrieved.",
      data: {
        levels: Object.values(LogLevel),
        devices: getDevices(),
        contexts: getContexts(),
      },
    }
  );
}

/**
 * DELETE /api/logs — Clear all stored logs
 */
export function handleClearLogs(_req: Request, res: Response): void {
  clearLogs();
  res.status(200).json(<ApiResponse>{
    success: true,
    message: "All logs cleared.",
  });
}

/**
 * GET /api/health — Health check
 */
export function handleHealth(_req: Request, res: Response): void {
  res.status(200).json(<ApiResponse<{ status: string; uptime: number }>>{
    success: true,
    message: "Server is running.",
    data: {
      status: "ok",
      uptime: process.uptime(),
    },
  });
}