import express from "express";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { connectDB, connectRedis } from "./utils/feature.js";
import { config } from "dotenv";
import morgan from "morgan";
import Stripe from "stripe";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";

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
const redisURI = process.env.REDIS_URI || "";
const stripeKey = process.env.STRIPE_KEY || "";
const clientURL = process.env.CLIENT_URL || "";
export const redisTTL = process.env.REDIS_TTL || 60 * 60 * 1;

connectDB(mongoURI);
export const redis = connectRedis(redisURI);

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

export const stripe = new Stripe(stripeKey);

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
