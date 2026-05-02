import { Router } from "express";
import { getSummaryReport, getDetailedReport } from "../controllers/reportController.ts";
import { authenticateToken } from "../middleware/auth.ts";

const router = Router();

router.get("/summary", authenticateToken, getSummaryReport);
router.get("/detailed", authenticateToken, getDetailedReport);

export default router;
