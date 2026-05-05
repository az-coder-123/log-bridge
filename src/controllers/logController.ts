import type { NextFunction, Request, Response } from "express";
import { writeToFile } from "../services/fileLogService.js";
import { prettyPrint } from "../services/logger.js";
import type { ApiResponse, LogEntry } from "../types/log.js";

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
    const entry = req.body as LogEntry;

    // Validate required fields
    if (!entry.device_info || !entry.level || !entry.timestamp) {
      res.status(400).json(<ApiResponse>{
        success: false,
        message:
          "Missing required fields: device_info, level, timestamp are required.",
      });
      return;
    }

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
  next: NextFunction
): void {
  try {
    res.status(200).json(<ApiResponse<{ status: string; uptime: number }>>{
      success: true,
      message: "Server is running.",
      data: {
        status: "ok",
        uptime: process.uptime(),
      },
    });
  } catch (error) {
    next(error);
  }
}