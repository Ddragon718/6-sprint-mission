import bcrypt from "bcrypt";
import { prismaClient } from "../../src/libs/prismaClient.js";
import { generateTokens } from "../../src/libs/token.js";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from "../../src/libs/constants.js";

type CreateUserInput = {
  email: string;
  nickname: string;
  password: string;
};

type CreateProductInput = {
  userId: number;
  name?: string;
  description?: string;
  price?: number;
  tags?: string[];
  images?: string[];
};

type CreateArticleInput = {
  userId: number;
  title?: string;
  content?: string;
  image?: string | null;
};

export async function resetDatabase() {
  await prismaClient.notification.deleteMany();
  await prismaClient.like.deleteMany();
  await prismaClient.favorite.deleteMany();
  await prismaClient.comment.deleteMany();
  await prismaClient.article.deleteMany();
  await prismaClient.product.deleteMany();
  await prismaClient.user.deleteMany();
}

export async function createUser(input: CreateUserInput) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(input.password, salt);

  return prismaClient.user.create({
    data: {
      email: input.email,
      nickname: input.nickname,
      password: hashedPassword,
    },
  });
}

export async function createProduct(input: CreateProductInput) {
  return prismaClient.product.create({
    data: {
      userId: input.userId,
      name: input.name ?? "Test Product",
      description: input.description ?? "Test Description",
      price: input.price ?? 1000,
      tags: input.tags ?? ["test"],
      images: input.images ?? ["https://example.com/image.png"],
    },
  });
}

export async function createArticle(input: CreateArticleInput) {
  return prismaClient.article.create({
    data: {
      userId: input.userId,
      title: input.title ?? "Test Article",
      content: input.content ?? "Test Content",
      image: input.image ?? null,
    },
  });
}

export async function createFavorite(userId: number, productId: number) {
  return prismaClient.favorite.create({
    data: { userId, productId },
  });
}

export async function createLike(userId: number, articleId: number) {
  return prismaClient.like.create({
    data: { userId, articleId },
  });
}

export function buildAuthCookie(userId: number) {
  const { accessToken, refreshToken } = generateTokens(userId);
  return [
    `${ACCESS_TOKEN_COOKIE_NAME}=${accessToken}`,
    `${REFRESH_TOKEN_COOKIE_NAME}=${refreshToken}`,
  ];
}
