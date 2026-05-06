import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { APP_CONFIG } from "./config/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import logRoutes from "./routes/logRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Create and configure the Express application.
 */
export function createApp(): express.Express {
  const app = express();

  // ── Global middlewares ──────────────────────────────────
  app.use(cors(APP_CONFIG.cors));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // ── API Routes ──────────────────────────────────────────
  app.use("/api", logRoutes);

  // ── Serve Dashboard UI ──────────────────────────────────
  const publicDir = path.resolve(__dirname, "..", "public");
  app.use(express.static(publicDir));

  // SPA fallback — serve index.html for any non-API, non-static route
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });

  // ── Error handler (must be last) ────────────────────────
  app.use(errorHandler);

  return app;
}
