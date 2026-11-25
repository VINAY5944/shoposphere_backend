import { Router } from "express";
import adminNotificationController from "../controllers/admin-notification.controller.js";

const router = Router();

router.get("/", adminNotificationController.listNotifications);
router.get("/failed-jobs", adminNotificationController.listFailedJobs);

export default router;
