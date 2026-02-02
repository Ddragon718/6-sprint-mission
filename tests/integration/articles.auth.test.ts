import request from "supertest";
import { app } from "../../src/app.js";
import {
  buildAuthCookie,
  createArticle,
  createUser,
} from "../utils/testDb.js";

describe("Authenticated Articles API", () => {
  test("POST /articles requires authentication", async () => {
    const response = await request(app).post("/articles").send({
      title: "No Auth",
      content: "Should fail",
    });

    expect(response.status).toBe(401);
  });

  test("POST /articles creates an article for the authenticated user", async () => {
    const author = await createUser({
      email: "article-author@example.com",
      nickname: "article-author",
      password: "password123",
    });

    const response = await request(app)
      .post("/articles")
      .set("Cookie", buildAuthCookie(author.id))
      .send({
        title: "Auth Article",
        content: "Auth Content",
        image: null,
      });

    expect(response.status).toBe(201);
    expect(response.body.userId).toBe(author.id);
    expect(response.body.title).toBe("Auth Article");
  });

  test("PATCH /articles/:id updates when user is the owner", async () => {
    const author = await createUser({
      email: "article-update@example.com",
      nickname: "article-update",
      password: "password123",
    });
    const article = await createArticle({ userId: author.id });

    const response = await request(app)
      .patch(`/articles/${article.id}`)
      .set("Cookie", buildAuthCookie(author.id))
      .send({ title: "Updated Title" });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe("Updated Title");
  });

  test("POST /articles/:id/comments creates a comment when authenticated", async () => {
    const author = await createUser({
      email: "article-comment-author@example.com",
      nickname: "article-comment-author",
      password: "password123",
    });
    const commenter = await createUser({
      email: "article-commenter@example.com",
      nickname: "article-commenter",
      password: "password123",
    });
    const article = await createArticle({ userId: author.id });

    const response = await request(app)
      .post(`/articles/${article.id}/comments`)
      .set("Cookie", buildAuthCookie(commenter.id))
      .send({ content: "Nice article" });

    expect(response.status).toBe(201);
    expect(response.body.userId).toBe(commenter.id);
    expect(response.body.articleId).toBe(article.id);
  });

  test("POST /articles/:id/likes creates a like when authenticated", async () => {
    const author = await createUser({
      email: "article-like-author@example.com",
      nickname: "article-like-author",
      password: "password123",
    });
    const liker = await createUser({
      email: "article-liker@example.com",
      nickname: "article-liker",
      password: "password123",
    });
    const article = await createArticle({ userId: author.id });

    const response = await request(app)
      .post(`/articles/${article.id}/likes`)
      .set("Cookie", buildAuthCookie(liker.id));

    expect(response.status).toBe(201);
  });
});

