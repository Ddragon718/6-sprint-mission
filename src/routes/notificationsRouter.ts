import express from "express";
import { withAsync } from "../libs/withAsync.js";
import authenticate from "../middlewares/authenticate.js";
import {
  getNotificationList,
  getUnreadNotificationCount,
  markNotificationRead,
} from "../controllers/notificationController.js";

const notificationsRouter = express.Router();

notificationsRouter.get("/", authenticate(), withAsync(getNotificationList));
notificationsRouter.get(
  "/unread-count",
  authenticate(),
  withAsync(getUnreadNotificationCount)
);
notificationsRouter.patch(
  "/:id/read",
  authenticate(),
  withAsync(markNotificationRead)
);

export default notificationsRouter;
