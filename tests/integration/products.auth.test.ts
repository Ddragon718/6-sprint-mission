import request from "supertest";
import { app } from "../../src/app.js";
import {
  buildAuthCookie,
  createProduct,
  createUser,
} from "../utils/testDb.js";

describe("Authenticated Products API", () => {
  test("POST /products requires authentication", async () => {
    const response = await request(app).post("/products").send({
      name: "New Product",
      description: "Desc",
      price: 1000,
      tags: ["tag"],
      images: ["https://example.com/image.png"],
    });

    expect(response.status).toBe(401);
  });

  test("POST /products creates a product for the authenticated user", async () => {
    const user = await createUser({
      email: "product-owner@example.com",
      nickname: "product-owner",
      password: "password123",
    });

    const response = await request(app)
      .post("/products")
      .set("Cookie", buildAuthCookie(user.id))
      .send({
        name: "Owned Product",
        description: "Owned Desc",
        price: 2000,
        tags: ["owned"],
        images: ["https://example.com/owned.png"],
      });

    expect(response.status).toBe(201);
    expect(response.body.userId).toBe(user.id);
    expect(response.body.name).toBe("Owned Product");
  });

  test("PATCH /products/:id updates when user is the owner", async () => {
    const user = await createUser({
      email: "product-update@example.com",
      nickname: "product-update",
      password: "password123",
    });
    const product = await createProduct({ userId: user.id, price: 1000 });

    const response = await request(app)
      .patch(`/products/${product.id}`)
      .set("Cookie", buildAuthCookie(user.id))
      .send({ price: 1200 });

    expect(response.status).toBe(200);
    expect(response.body.price).toBe(1200);
  });

  test("POST /products/:id/comments creates a comment when authenticated", async () => {
    const owner = await createUser({
      email: "product-comment-owner@example.com",
      nickname: "product-comment-owner",
      password: "password123",
    });
    const commenter = await createUser({
      email: "product-commenter@example.com",
      nickname: "product-commenter",
      password: "password123",
    });
    const product = await createProduct({ userId: owner.id });

    const response = await request(app)
      .post(`/products/${product.id}/comments`)
      .set("Cookie", buildAuthCookie(commenter.id))
      .send({ content: "Nice product" });

    expect(response.status).toBe(201);
    expect(response.body.userId).toBe(commenter.id);
    expect(response.body.productId).toBe(product.id);
  });
});

