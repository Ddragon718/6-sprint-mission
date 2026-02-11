import jwt, { JwtPayload } from "jsonwebtoken";
import {
  JWT_ACCESS_TOKEN_SECRET,
  JWT_REFRESH_TOKEN_SECRET,
} from "./constants.js";

type TokenPayload = { id: number };

function assertSecret(secret: string | undefined, name: string): string {
  if (!secret) {
    throw new Error(`${name} is not configured`);
  }
  return secret;
}

function parsePayload(decoded: string | JwtPayload): TokenPayload {
  if (!decoded || typeof decoded !== "object" || typeof decoded.id !== "number") {
    throw new Error("Invalid token payload");
  }
  return { id: decoded.id };
}

export function generateTokens(userId: number) {
  const accessSecret = assertSecret(
    JWT_ACCESS_TOKEN_SECRET,
    "JWT_ACCESS_TOKEN_SECRET"
  );
  const refreshSecret = assertSecret(
    JWT_REFRESH_TOKEN_SECRET,
    "JWT_REFRESH_TOKEN_SECRET"
  );

  const accessToken = jwt.sign({ id: userId }, accessSecret, {
    expiresIn: "1h",
  });
  const refreshToken = jwt.sign({ id: userId }, refreshSecret, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string) {
  const accessSecret = assertSecret(
    JWT_ACCESS_TOKEN_SECRET,
    "JWT_ACCESS_TOKEN_SECRET"
  );
  const decoded = jwt.verify(token, accessSecret);
  const payload = parsePayload(decoded);
  return { userId: payload.id };
}

export function verifyRefreshToken(token: string) {
  const refreshSecret = assertSecret(
    JWT_REFRESH_TOKEN_SECRET,
    "JWT_REFRESH_TOKEN_SECRET"
  );
  const decoded = jwt.verify(token, refreshSecret);
  const payload = parsePayload(decoded);
  return { userId: payload.id };
}
