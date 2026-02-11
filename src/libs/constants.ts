import dotenv from "dotenv";
dotenv.config();

export const ACCESS_TOKEN_COOKIE_NAME = "access-token";
export const REFRESH_TOKEN_COOKIE_NAME = "refresh-token";
export const DATABASE_URL: string | undefined = process.env.DATABASE_URL;
export const JWT_ACCESS_TOKEN_SECRET: string | undefined =
  process.env.JWT_ACCESS_TOKEN_SECRET;
export const JWT_REFRESH_TOKEN_SECRET: string | undefined =
  process.env.JWT_REFRESH_TOKEN_SECRET;
export const NODE_ENV: string = process.env.NODE_ENV || "development";
const portEnv = process.env.PORT;
export const PORT: number = portEnv ? Number(portEnv) : 3000;
export const PUBLIC_PATH = "./public";
export const STATIC_PATH = "/public";
