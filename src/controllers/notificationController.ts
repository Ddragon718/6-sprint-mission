import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { create } from "superstruct";
import { prismaClient } from "../libs/prismaClient.js";
import { UnauthorizedError, NotFoundError, ForbiddenError } from "../libs/errors.js";
import { IdParamsStruct } from "../structs/commonStructs.js";
import { GetNotificationListParamsStruct } from "../structs/notificationsStructs.js";

export async function getNotificationList(req: Request, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError("Unauthorized");
  }

  const { page, pageSize, isRead } = create(
    req.query,
    GetNotificationListParamsStruct
  );

  const where: Prisma.NotificationWhereInput = {
    userId: req.user.id,
  };
  if (isRead !== undefined) {
    where.isRead = isRead;
  }

  const totalCount = await prismaClient.notification.count({ where });
  const notifications = await prismaClient.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return res.send({
    list: notifications,
    totalCount,
  });
}

export async function getUnreadNotificationCount(req: Request, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError("Unauthorized");
  }

  const count = await prismaClient.notification.count({
    where: { userId: req.user.id, isRead: false },
  });

  return res.send({ count });
}

export async function markNotificationRead(req: Request, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError("Unauthorized");
  }

  const { id } = create(req.params, IdParamsStruct);
  const notification = await prismaClient.notification.findUnique({
    where: { id },
  });
  if (!notification) {
    throw new NotFoundError("notification", id);
  }
  if (notification.userId !== req.user.id) {
    throw new ForbiddenError("Should be the owner of the notification");
  }

  const updated = await prismaClient.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return res.send(updated);
}
