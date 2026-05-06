import { Router } from "express";
import {
    handleClearLogs,
    handleGetFilters,
    handleGetLogs,
    handleGetStats,
    handleHealth,
    handleLog,
} from "../controllers/logController.js";

const router = Router();

// Health check
router.get("/health", handleHealth);

// Log CRUD
router.get("/logs/stats", handleGetStats);
router.get("/logs/filters", handleGetFilters);
router.get("/logs", handleGetLogs);
router.post("/logs", handleLog);
router.delete("/logs", handleClearLogs);

export default router;