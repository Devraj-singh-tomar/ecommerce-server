import express from "express";
import { adminOnly } from "../middlewares/auth.middleware.js";
import {
  allOrders,
  myOrders,
  newOrder,
} from "../controllers/order.controller.js";

const app = express.Router();

app.post("/new", newOrder);

app.get("/my", myOrders);

app.get("/all", adminOnly, allOrders);

export default app;
