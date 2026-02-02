import request from "supertest";
import { app } from "../../src/app.js";
import {
  createFavorite,
  createProduct,
  createUser,
} from "../utils/testDb.js";

describe("Public Products API", () => {
  test("GET /products/:id returns favoriteCount and no isFavorited without auth", async () => {
    const owner = await createUser({
      email: "owner@example.com",
      nickname: "owner",
      password: "password123",
    });
    const fan = await createUser({
      email: "fan@example.com",
      nickname: "fan",
      password: "password123",
    });

    const product = await createProduct({ userId: owner.id, price: 1500 });
    await createFavorite(fan.id, product.id);

    const response = await request(app).get(`/products/${product.id}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(product.id);
    expect(response.body.favoriteCount).toBe(1);
    expect(response.body.isFavorited).toBeUndefined();
  });

  test("GET /products returns paginated list and totalCount", async () => {
    const owner = await createUser({
      email: "list-owner@example.com",
      nickname: "list-owner",
      password: "password123",
    });

    await createProduct({ userId: owner.id, name: "Alpha" });
    await createProduct({ userId: owner.id, name: "Beta" });

    const response = await request(app).get("/products?page=1&pageSize=10");

    expect(response.status).toBe(200);
    expect(response.body.totalCount).toBe(2);
    expect(Array.isArray(response.body.list)).toBe(true);
    expect(response.body.list).toHaveLength(2);
    expect(response.body.list[0]).toHaveProperty("favoriteCount");
  });
});

