import request from "supertest";
import { app } from "../../src/app.js";
import { createArticle, createLike, createUser } from "../utils/testDb.js";

describe("Public Articles API", () => {
  test("GET /articles/:id returns likeCount and no isLiked without auth", async () => {
    const author = await createUser({
      email: "author@example.com",
      nickname: "author",
      password: "password123",
    });
    const liker = await createUser({
      email: "liker@example.com",
      nickname: "liker",
      password: "password123",
    });

    const article = await createArticle({ userId: author.id });
    await createLike(liker.id, article.id);

    const response = await request(app).get(`/articles/${article.id}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(article.id);
    expect(response.body.likeCount).toBe(1);
    expect(response.body.isLiked).toBeUndefined();
  });

  test("GET /articles returns list and totalCount", async () => {
    const author = await createUser({
      email: "list-author@example.com",
      nickname: "list-author",
      password: "password123",
    });

    await createArticle({ userId: author.id, title: "First" });
    await createArticle({ userId: author.id, title: "Second" });

    const response = await request(app).get("/articles?page=1&pageSize=10");

    expect(response.status).toBe(200);
    expect(response.body.totalCount).toBe(2);
    expect(Array.isArray(response.body.list)).toBe(true);
    expect(response.body.list).toHaveLength(2);
    expect(response.body.list[0]).toHaveProperty("likeCount");
  });
});

