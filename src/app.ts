import express from "express";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { connectDB } from "./utils/feature.js";
import NodeCache from "node-cache";
import { config } from "dotenv";
import morgan from "morgan";
import Stripe from "stripe";
import cors from "cors";

// IMPORTING ROUTES
import userRoute from "./routes/user.route.js";
import productRoute from "./routes/product.route.js";
import orderRoute from "./routes/order.route.js";
import paymentRoute from "./routes/payment.route.js";
import dashboardRoute from "./routes/stats.route.js";

config({
  path: "./.env",
});

const port = process.env.PORT || 4000;

const mongoURI = process.env.MONGO_URI || "";
const stripeKey = process.env.STRIPE_KEY || "";
const clientURL = process.env.CLIENT_URL || "";

connectDB(mongoURI);

export const stripe = new Stripe(stripeKey);

export const myCache = new NodeCache();

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(
  cors({
    origin: [clientURL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// USER ROUTE
app.use("/api/v1/user", userRoute);
// PRODUCT ROUTE
app.use("/api/v1/product", productRoute);
// ORDER ROUTE
app.use("/api/v1/order", orderRoute);
// PAYMENT ROUTE
app.use("/api/v1/payment", paymentRoute);
// DASHBOARD ROUTE
app.use("/api/v1/dashboard", dashboardRoute);

// MIDDLEWARE's
app.use("/uploads", express.static("uploads"));
app.use(errorMiddleware);

app.get("/hello", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log(`server is working on localhost ${port}`);
});
