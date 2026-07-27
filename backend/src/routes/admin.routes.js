import { Router } from "express";
import { getDashboardStats, getWorkers, getQueueDetails } from "../controllers/admin.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// Enforce JWT verification and admin role check on all admin routes
router.use(verifyJWT, verifyAdmin);

router.get("/stats", getDashboardStats);
router.get("/workers", getWorkers);
router.get("/queue", getQueueDetails);

export default router;
