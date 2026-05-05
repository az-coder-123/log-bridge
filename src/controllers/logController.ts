import type { NextFunction, Request, Response } from "express";
import { writeToFile } from "../services/fileLogService.js";
import { prettyPrint } from "../services/logger.js";
import type { ApiResponse, LogEntry } from "../types/log.js";
import { LogLevel } from "../types/log.js";

const VALID_LEVELS = new Set<string>(Object.values(LogLevel));

/**
 * Validates the incoming log entry has all required fields with correct types.
 * Returns an error message string if invalid, or null if valid.
 */
function validateLogEntry(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Request body must be a JSON object.";
  }

  const entry = body as Record<string, unknown>;

  // Validate device_info
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

  // Validate level
  if (!entry.level || typeof entry.level !== "string") {
    return "Missing or invalid 'level': must be a string.";
  }
  if (!VALID_LEVELS.has(entry.level)) {
    return `Invalid 'level': must be one of: ${Object.values(LogLevel).join(", ")}.`;
  }

  // Validate timestamp
  if (!entry.timestamp || typeof entry.timestamp !== "string") {
    return "Missing or invalid 'timestamp': must be an ISO 8601 string.";
  }
  if (isNaN(Date.parse(entry.timestamp))) {
    return "Invalid 'timestamp': must be a valid ISO 8601 date string.";
  }

  return null;
}

/**
 * Handles POST /api/logs
 * Receives a log entry from a Flutter client,
 * prints it to the terminal, and persists it to disk.
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

    // 1. Pretty-print to terminal (console output)
    prettyPrint(entry);

    // 2. Persist to log file
    writeToFile(entry);

    // 3. Acknowledge
    res.status(200).json(<ApiResponse>{
      success: true,
      message: "Log received successfully.",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles GET /api/health
 * Simple health-check endpoint.
 */
export function handleHealth(
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(200).json(<ApiResponse<{ status: string; uptime: number }>>{
    success: true,
    message: "Server is running.",
    data: {
      status: "ok",
      uptime: process.uptime(),
    },
  });
}