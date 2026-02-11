import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { prismaClient } from "./prismaClient.js";
import { verifyAccessToken } from "./token.js";
import { ACCESS_TOKEN_COOKIE_NAME } from "./constants.js";

let io: Server | null = null;

type CookieMap = Record<string, string>;

function parseCookies(cookieHeader?: string): CookieMap {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<CookieMap>((acc, part) => {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey) {
      return acc;
    }
    acc[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue.join("="));
    return acc;
  }, {});
}

export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const cookies = parseCookies(socket.request.headers.cookie);
    const accessToken = cookies[ACCESS_TOKEN_COOKIE_NAME];
    if (!accessToken) {
      return next(new Error("Unauthorized"));
    }

    try {
      const { userId } = verifyAccessToken(accessToken);
      const user = await prismaClient.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        return next(new Error("Unauthorized"));
      }
      socket.data.userId = userId;
      return next();
    } catch (error) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    if (typeof userId === "number") {
      socket.join(`user:${userId}`);
    }
  });

  return io;
}

export function getIo(): Server {
  if (!io) {
    throw new Error("Socket.io is not initialized");
  }
  return io;
}
