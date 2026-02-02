import type { Prisma, NotificationType, Notification } from "@prisma/client";
import { prismaClient } from "./prismaClient.js";
import { getIo } from "./socket.js";

type CreateNotificationInput = {
  userId: number;
  type: NotificationType;
  payload: Prisma.JsonObject;
};

export async function createNotification({
  userId,
  type,
  payload,
}: CreateNotificationInput): Promise<Notification> {
  const notification = await prismaClient.notification.create({
    data: {
      userId,
      type,
      payload,
    },
  });

  try {
    const io = getIo();
    io.to(`user:${userId}`).emit("notification", notification);
  } catch (error) {
    // Socket server not initialized or emit failed; keep DB record.
  }

  return notification;
}

/**
 * Mutable wrapper to make ESM-friendly spies/mocks in tests.
 * Controllers should call notificationApi.createNotification.
 */
export const notificationApi = {
  createNotification,
};
