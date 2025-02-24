import express from "express";
import { adminOnly } from "../middlewares/auth.middleware.js";
import {
  getAdminProducts,
  getAllCategories,
  getLatestProducts,
  newProduct,
} from "../controllers/product.controller.js";
import { singleUpload } from "../middlewares/multer.middleware.js";

const app = express.Router();

// TO CREATE NEW PRODUCT
app.post("/new", adminOnly, singleUpload, newProduct);

// TO GET LATEST PRODUCT
app.get("/latest", getLatestProducts);

// TO GET ALL UNIQUE CATEGORIES
app.get("/categories", getAllCategories);

// TO GET ALL ADMIN PRODUCTS
app.get("/admin-products", getAdminProducts);

export default app;
