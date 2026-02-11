import express from "express";
import { withAsync } from "../libs/withAsync.js";
import { upload, uploadImage } from "../controllers/imagesController.js";

const imagesRouter = express.Router();

imagesRouter.post("/upload", upload.single("image"), withAsync(uploadImage));

export default imagesRouter;
