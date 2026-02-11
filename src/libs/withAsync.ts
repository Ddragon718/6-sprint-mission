import type { RequestHandler } from "express";

export function withAsync(handler: RequestHandler): RequestHandler {
  return async function (req, res, next) {
    try {
      await handler(req, res, next);
    } catch (e) {
      next(e);
    }
  };
}
