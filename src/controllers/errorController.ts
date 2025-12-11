import type { NextFunction, Request, Response } from "express";
import { StructError } from "superstruct";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from "../libs/errors.js";

type PrismaLikeError = {
  code?: string;
};

export function defaultNotFoundHandler(
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  return res.status(404).send({ message: "Not found" });
}

function isJsonSyntaxError(
  err: unknown
): err is SyntaxError & { status?: number; body?: unknown } {
  return (
    err instanceof SyntaxError &&
    typeof (err as { status?: unknown }).status === "number" &&
    "body" in err
  );
}

export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  /** From superstruct or application error */
  if (err instanceof StructError || err instanceof BadRequestError) {
    return res.status(400).send({ message: err.message });
  }

  /** From express.json middleware */
  if (isJsonSyntaxError(err) && err.status === 400) {
    return res.status(400).send({ message: "Invalid JSON" });
  }

  /** Prisma error codes */
  if (typeof err === "object" && err !== null && (err as PrismaLikeError).code) {
    console.error(err);
    return res.status(500).send({ message: "Failed to process data" });
  }

  /** Application errors */
  if (err instanceof NotFoundError) {
    return res.status(404).send({ message: err.message });
  }

  if (err instanceof UnauthorizedError) {
    return res.status(401).send({ message: err.message });
  }

  if (err instanceof ForbiddenError) {
    return res.status(403).send({ message: err.message });
  }

  console.error(err);
  return res.status(500).send({ message: "Internal server error" });
}
