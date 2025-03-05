import express from "express";
import { adminOnly } from "../middlewares/auth.middleware.js";
import {
  deleteProduct,
  getAdminProducts,
  getAllCategories,
  getAllProducts,
  getLatestProducts,
  getSingleProduct,
  newProduct,
  newReview,
  deleteReview,
  updateProduct,
} from "../controllers/product.controller.js";
import { multiUpload, singleUpload } from "../middlewares/multer.middleware.js";

const app = express.Router();

// TO CREATE NEW PRODUCT
app.post("/new", adminOnly, multiUpload, newProduct);

// TO GET LATEST PRODUCT
app.get("/latest", getLatestProducts);

// ALL PRODUCTS WITH SEARCH , SORT , FILTER
app.get("/all", getAllProducts);

// TO GET ALL UNIQUE CATEGORIES
app.get("/categories", getAllCategories);

// TO GET ALL ADMIN PRODUCTS
app.get("/admin-products", adminOnly, getAdminProducts);

// TO GET, UPDATE & DELETE PRODUCT BY ID
app
  .route("/:id")
  .get(getSingleProduct)
  .put(adminOnly, multiUpload, updateProduct)
  .delete(adminOnly, deleteProduct);

// PRODUCT REVIEW ROUTE's ==============================

app.post("/review/new/:id", newReview);

app.delete("/review/:id", deleteReview);

export default app;
