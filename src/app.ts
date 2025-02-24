import express from "express";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { connectDB } from "./utils/feature.js";

// IMPORTING ROUTES
import userRoute from "./routes/user.route.js";
import productRoute from "./routes/product.route.js";

const port = 4000;

connectDB();

const app = express();

app.use(express.json());

// USER ROUTE
app.use("/api/v1/user", userRoute);
// PRODUCT ROUTE
app.use("/api/v1/product", productRoute);

// MIDDLEWARE's
app.use("/uploads", express.static("uploads"));
app.use(errorMiddleware);

app.get("/hello", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log(`server is working on localhost ${port}`);
});
