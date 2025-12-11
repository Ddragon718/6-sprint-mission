import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { create } from "superstruct";
import { prismaClient } from "../libs/prismaClient.js";
import { UpdateCommentBodyStruct } from "../structs/commentsStruct.js";
import NotFoundError from "../libs/errors/NotFoundError.js";
import { IdParamsStruct } from "../structs/commonStructs.js";
import UnauthorizedError from "../libs/errors/UnauthorizedError.js";
import ForbiddenError from "../libs/errors/ForbiddenError.js";

export async function updateComment(req: Request, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError("Unauthorized");
  }

  const { id } = create(req.params, IdParamsStruct);
  const { content } = create(req.body, UpdateCommentBodyStruct) as {
    content?: string;
  };
  const updateData: Prisma.CommentUpdateInput = {};
  if (content !== undefined) {
    updateData.content = content;
  }

  const existingComment = await prismaClient.comment.findUnique({
    where: { id },
  });
  if (!existingComment) {
    throw new NotFoundError("comment", id);
  }

  if (existingComment.userId !== req.user.id) {
    throw new ForbiddenError("Should be the owner of the comment");
  }

  const updatedComment = await prismaClient.comment.update({
    where: { id },
    data: updateData,
  });

  return res.send(updatedComment);
}

export async function deleteComment(req: Request, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError("Unauthorized");
  }

  const { id } = create(req.params, IdParamsStruct);

  const existingComment = await prismaClient.comment.findUnique({
    where: { id },
  });
  if (!existingComment) {
    throw new NotFoundError("comment", id);
  }

  if (existingComment.userId !== req.user.id) {
    throw new ForbiddenError("Should be the owner of the comment");
  }

  await prismaClient.comment.delete({ where: { id } });
  return res.status(204).send();
}
