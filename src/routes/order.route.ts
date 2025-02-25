import express from "express";
import { adminOnly } from "../middlewares/auth.middleware.js";
import {
  allOrders,
  getSingleOrders,
  myOrders,
  newOrder,
} from "../controllers/order.controller.js";

const app = express.Router();

app.post("/new", newOrder);

app.get("/my", myOrders);

app.get("/all", adminOnly, allOrders);

app.route("/:id").get(getSingleOrders);

export default app;
