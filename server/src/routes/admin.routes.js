import { Router } from "express";

import {
  activityLogs,
  adminJobs,
  adminOverview,
  adminSettings,
  destroyLockPeriod,
  emergencyAction,
  getLockPeriods,
  postAdminLog,
  postLockPeriod,
  protocolHealth,
  putLockPeriod,
  saveAdminSettings,
  systemHealth,
  users,
} from "../controllers/admin.controller.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.use(authenticate, authorize("admin"));
router.get("/settings", asyncHandler(adminSettings));
router.put("/settings", asyncHandler(saveAdminSettings));
router.get("/lock-periods", asyncHandler(getLockPeriods));
router.post("/lock-periods", asyncHandler(postLockPeriod));
router.put("/lock-periods/:id", asyncHandler(putLockPeriod));
router.delete("/lock-periods/:id", asyncHandler(destroyLockPeriod));
router.post("/emergency-action", asyncHandler(emergencyAction));
router.get("/activity-logs", asyncHandler(activityLogs));
router.get("/logs", asyncHandler(activityLogs));
router.post("/logs", asyncHandler(postAdminLog));
router.get("/system-health", asyncHandler(systemHealth));
router.get("/overview", asyncHandler(adminOverview));
router.get("/jobs", asyncHandler(adminJobs));
router.get("/protocol-health", asyncHandler(protocolHealth));
router.get("/users", asyncHandler(users));

export default router;
