import express from "express";
import { adminOnly } from "../middlewares/auth.middleware.js";
import {
  allCoupon,
  applyDiscount,
  createPaymentIntent,
  deleteCoupon,
  getCoupon,
  newCoupon,
  updateCoupon,
} from "../controllers/payment.controller.js";

const app = express.Router();

// STRIPE PAYMENT INTENT
app.post("/create", createPaymentIntent);

// TO APPLY COUPON DISCOUNT
app.get("/discount", applyDiscount);

// TO CREATE NEW COUPON
app.post("/coupon/new", adminOnly, newCoupon);

// TO RETRIEVE ALL COUPON
app.get("/coupon/all", adminOnly, allCoupon);

// TO DELETE, GET, UPDATE COUPON
app
  .route("/coupon/:id")
  .get(adminOnly, getCoupon)
  .put(adminOnly, updateCoupon)
  .delete(adminOnly, deleteCoupon);

export default app;
