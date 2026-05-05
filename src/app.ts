import cors from "cors";
import express from "express";
import { APP_CONFIG } from "./config/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import logRoutes from "./routes/logRoutes.js";

/**
 * Create and configure the Express application.
 */
export function createApp(): express.Express {
  const app = express();

  // ── Global middlewares ──────────────────────────────────
  app.use(cors(APP_CONFIG.cors));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // ── Routes ──────────────────────────────────────────────
  app.use("/api", logRoutes);

  // ── Error handler (must be last) ────────────────────────
  app.use(errorHandler);

  return app;
}