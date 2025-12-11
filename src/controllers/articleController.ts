import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { create } from "superstruct";
import { prismaClient } from "../libs/prismaClient.js";
import NotFoundError from "../libs/errors/NotFoundError.js";
import { IdParamsStruct } from "../structs/commonStructs.js";
import {
  CreateArticleBodyStruct,
  UpdateArticleBodyStruct,
  GetArticleListParamsStruct,
} from "../structs/articlesStructs.js";
import {
  CreateCommentBodyStruct,
  GetCommentListParamsStruct,
} from "../structs/commentsStruct.js";
import UnauthorizedError from "../libs/errors/UnauthorizedError.js";
import ForbiddenError from "../libs/errors/ForbiddenError.js";
import BadRequestError from "../libs/errors/BadRequestError.js";

export async function createArticle(req: Request, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError("Unauthorized");
  }

  const data = create(req.body, CreateArticleBodyStruct);

  const article = await prismaClient.article.create({
    data: {
      ...data,
      userId: req.user.id,
    },
  });

  return res.status(201).send(article);
}

export async function getArticle(req: Request, res: Response) {
  const { id } = create(req.params, IdParamsStruct);

  const article = await prismaClient.article.findUnique(
    {
      where: { id },
      include: {
        likes: true,
      },
    } satisfies Prisma.ArticleFindUniqueArgs
  );
  if (!article) {
    throw new NotFoundError("article", id);
  }

  const articleWithLikes = {
    ...article,
    likes: undefined,
    likeCount: article.likes.length,
    isLiked: req.user
      ? article.likes.some((like) => like.userId === req.user!.id)
      : undefined,
  };

  return res.send(articleWithLikes);
}

export async function updateArticle(req: Request, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError("Unauthorized");
  }

  const { id } = create(req.params, IdParamsStruct);
  const data = create(req.body, UpdateArticleBodyStruct) as Partial<
    Pick<Prisma.ArticleUpdateInput, "title" | "content" | "image">
  >;
  const updateData: Prisma.ArticleUpdateInput = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.image !== undefined) updateData.image = data.image;

  const existingArticle = await prismaClient.article.findUnique({
    where: { id },
  });
  if (!existingArticle) {
    throw new NotFoundError("article", id);
  }

  if (existingArticle.userId !== req.user.id) {
    throw new ForbiddenError("Should be the owner of the article");
  }

  const updatedArticle = await prismaClient.article.update({
    where: { id },
    data: updateData,
  });
  return res.send(updatedArticle);
}

export async function deleteArticle(req: Request, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError("Unauthorized");
  }

  const { id } = create(req.params, IdParamsStruct);

  const existingArticle = await prismaClient.article.findUnique({
    where: { id },
  });
  if (!existingArticle) {
    throw new NotFoundError("article", id);
  }

  if (existingArticle.userId !== req.user.id) {
    throw new ForbiddenError("Should be the owner of the article");
  }

  await prismaClient.article.delete({ where: { id } });
  return res.status(204).send();
}

export async function getArticleList(req: Request, res: Response) {
  const { page, pageSize, orderBy, keyword } = create(
    req.query,
    GetArticleListParamsStruct
  );

  const where: Prisma.ArticleWhereInput = {};
  if (keyword) {
    where.title = { contains: keyword };
  }

  const totalCount = await prismaClient.article.count({ where });
  const articles = await prismaClient.article.findMany(
    {
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: orderBy === "recent" ? { createdAt: "desc" } : { id: "asc" },
      where,
      include: {
        likes: true,
      },
    } satisfies Prisma.ArticleFindManyArgs
  );

  const articlesWithLikes = articles.map((article) => ({
    ...article,
    likes: undefined,
    likeCount: article.likes.length,
    isLiked: req.user
      ? article.likes.some((like) => like.userId === req.user!.id)
      : undefined,
  }));

  return res.send({
    list: articlesWithLikes,
    totalCount,
  });
}

export async function createComment(req: Request, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError("Unauthorized");
  }

  const { id: articleId } = create(req.params, IdParamsStruct);
  const { content } = create(req.body, CreateCommentBodyStruct);

  const existingArticle = await prismaClient.article.findUnique({
    where: { id: articleId },
  });
  if (!existingArticle) {
    throw new NotFoundError("article", articleId);
  }

  const createdComment = await prismaClient.comment.create({
    data: {
      articleId,
      content,
      userId: req.user.id,
    },
  });

  return res.status(201).send(createdComment);
}

export async function getCommentList(req: Request, res: Response) {
  const { id: articleId } = create(req.params, IdParamsStruct);
  const { cursor, limit } = create(req.query, GetCommentListParamsStruct);

  const article = await prismaClient.article.findUnique({
    where: { id: articleId },
  });
  if (!article) {
    throw new NotFoundError("article", articleId);
  }

  const commentsQuery: Prisma.CommentFindManyArgs = {
    take: limit + 1,
    where: { articleId },
    orderBy: { createdAt: "desc" },
  };
  if (cursor) {
    commentsQuery.cursor = { id: cursor };
  }

  const commentsWithCursor = await prismaClient.comment.findMany(
    commentsQuery
  );
  const comments = commentsWithCursor.slice(0, limit);
  const cursorComment = commentsWithCursor[commentsWithCursor.length - 1];
  const nextCursor = cursorComment ? cursorComment.id : null;

  return res.send({
    list: comments,
    nextCursor,
  });
}

export async function createLike(req: Request, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError("Unauthorized");
  }

  const { id: articleId } = create(req.params, IdParamsStruct);

  const existingArticle = await prismaClient.article.findUnique({
    where: { id: articleId },
  });
  if (!existingArticle) {
    throw new NotFoundError("article", articleId);
  }

  const existingLike = await prismaClient.like.findFirst({
    where: { articleId, userId: req.user.id },
  });
  if (existingLike) {
    throw new BadRequestError("Already liked");
  }

  await prismaClient.like.create({ data: { articleId, userId: req.user.id } });
  return res.status(201).send();
}

export async function deleteLike(req: Request, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError("Unauthorized");
  }

  const { id: articleId } = create(req.params, IdParamsStruct);

  const existingArticle = await prismaClient.article.findUnique({
    where: { id: articleId },
  });
  if (!existingArticle) {
    throw new NotFoundError("article", articleId);
  }

  const existingLike = await prismaClient.like.findFirst({
    where: { articleId, userId: req.user.id },
  });
  if (!existingLike) {
    throw new BadRequestError("Not liked");
  }

  await prismaClient.like.delete({ where: { id: existingLike.id } });
  return res.status(204).send();
}
