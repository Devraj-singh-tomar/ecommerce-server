import express from "express";
import { adminOnly } from "../middlewares/auth.middleware.js";
import { newProduct } from "../controllers/product.controller.js";
import { singleUpload } from "../middlewares/multer.middleware.js";

const app = express.Router();

app.post("/new", adminOnly, singleUpload, newProduct);

export default app;
