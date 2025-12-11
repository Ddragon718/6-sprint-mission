import express from "express";
import { withAsync } from "../libs/withAsync.js";
import {
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";
import authenticate from "../middlewares/authenticate.js";

const commentsRouter = express.Router();

commentsRouter.patch("/:id", authenticate(), withAsync(updateComment));
commentsRouter.delete("/:id", authenticate(), withAsync(deleteComment));

export default commentsRouter;
