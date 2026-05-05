import chalk from "chalk";
import type { NextFunction, Request, Response } from "express";

/**
 * Global error-handling middleware.
 * Catches any unhandled errors from controllers/services
 * and returns a consistent JSON error response.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(chalk.red(`[ERROR] ${err.message}`));
  if (err.stack) {
    console.error(chalk.gray(err.stack));
  }

  res.status(500).json({
    success: false,
    message: "Internal server error.",
    error: err.message,
  });
}