import express from "express";
import { errorMiddleware } from "./middlewares/error.middleware.js";

// IMPORTING ROUTES
import userRoute from "./routes/user.route.js";
import { connectDB } from "./utils/feature.js";

const port = 4000;

connectDB();

const app = express();

app.use(express.json());

// USER ROUTE
app.use("/api/v1/user", userRoute);

app.use(errorMiddleware);

app.get("/hello", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log(`server is working on localhost ${port}`);
});
