import type { RequestHandler } from "express";
import { prismaClient } from "../libs/prismaClient.js";
import { verifyAccessToken } from "../libs/token.js";
import { ACCESS_TOKEN_COOKIE_NAME } from "../libs/constants.js";

type AuthenticateOptions = {
  optional?: boolean;
};

function authenticate(options: AuthenticateOptions = { optional: false }): RequestHandler {
  return async (req, res, next) => {
    const accessToken = req.cookies?.[ACCESS_TOKEN_COOKIE_NAME];
    if (!accessToken) {
      if (options.optional) {
        return next();
      }
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { userId } = verifyAccessToken(accessToken);
      const user = await prismaClient.user.findUnique({
        where: { id: userId },
      });
      req.user = user;
    } catch (error) {
      if (options.optional) {
        return next();
      }
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };
}

export default authenticate;
