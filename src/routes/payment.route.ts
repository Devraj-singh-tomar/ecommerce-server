import express from "express";
import { adminOnly } from "../middlewares/auth.middleware.js";
import {
  allCoupon,
  applyDiscount,
  deleteCoupon,
  newCoupon,
} from "../controllers/payment.controller.js";

const app = express.Router();

// TO APPLY COUPON DISCOUNT
app.post("/discount", applyDiscount);

// TO CREATE NEW COUPON
app.post("/coupon/new", adminOnly, newCoupon);

// TO RETRIEVE ALL COUPON
app.get("/coupon/all", adminOnly, allCoupon);

// TO DELETE COUPON
app.delete("/coupon/:id", adminOnly, deleteCoupon);

export default app;
