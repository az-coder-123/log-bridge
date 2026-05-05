import { Router } from "express";
import { handleHealth, handleLog } from "../controllers/logController.js";

/**
 * Log API routes.
 */
const router = Router();

// Health check
router.get("/health", handleHealth);

// Receive logs from Flutter clients
router.post("/logs", handleLog);

export default router;