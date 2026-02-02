import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import { PUBLIC_PATH, STATIC_PATH } from "./libs/constants.js";
import articlesRouter from "./routes/articlesRouter.js";
import productsRouter from "./routes/productsRouter.js";
import commentsRouter from "./routes/commentsRouter.js";
import imagesRouter from "./routes/imagesRouter.js";
import authRouter from "./routes/authRouter.js";
import usersRouter from "./routes/usersRouter.js";
import notificationsRouter from "./routes/notificationsRouter.js";
import {
  defaultNotFoundHandler,
  globalErrorHandler,
} from "./controllers/errorController.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());
  app.use(STATIC_PATH, express.static(path.resolve(process.cwd(), PUBLIC_PATH)));

  app.use("/articles", articlesRouter);
  app.use("/products", productsRouter);
  app.use("/comments", commentsRouter);
  app.use("/image", imagesRouter);
  app.use("/auth", authRouter);
  app.use("/users", usersRouter);
  app.use("/notifications", notificationsRouter);

  app.use(defaultNotFoundHandler);
  app.use(globalErrorHandler);

  return app;
}

export const app = createApp();

