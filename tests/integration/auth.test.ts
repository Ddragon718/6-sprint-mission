import bcrypt from "bcrypt";
import request from "supertest";
import { app } from "../../src/app.js";
import { prismaClient } from "../../src/libs/prismaClient.js";
import { ACCESS_TOKEN_COOKIE_NAME } from "../../src/libs/constants.js";
import { createUser } from "../utils/testDb.js";

describe("Auth API", () => {
  test("POST /auth/register creates a user without returning password", async () => {
    const response = await request(app).post("/auth/register").send({
      email: "register@example.com",
      nickname: "register-user",
      password: "password123",
    });

    expect(response.status).toBe(201);
    expect(response.body.email).toBe("register@example.com");
    expect(response.body.nickname).toBe("register-user");
    expect(response.body.password).toBeUndefined();

    const created = await prismaClient.user.findUnique({
      where: { email: "register@example.com" },
    });
    expect(created).not.toBeNull();
    expect(created?.password).not.toBe("password123");
    expect(created && (await bcrypt.compare("password123", created.password))).toBe(
      true
    );
  });

  test("POST /auth/login sets auth cookies for valid credentials", async () => {
    await createUser({
      email: "login@example.com",
      nickname: "login-user",
      password: "password123",
    });

    const response = await request(app).post("/auth/login").send({
      email: "login@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    const rawSetCookie = response.headers["set-cookie"];
    const setCookie = Array.isArray(rawSetCookie)
      ? rawSetCookie
      : rawSetCookie
        ? [rawSetCookie]
        : [];
    expect(
      setCookie.some((cookie: string) =>
        cookie.startsWith(`${ACCESS_TOKEN_COOKIE_NAME}=`)
      )
    ).toBe(true);
  });
});
