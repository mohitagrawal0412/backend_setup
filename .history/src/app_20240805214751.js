import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "../src/routes/user.routes.js"; // Adjusted path

const app = express();

// Setup CORS with credentials support
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

// Middleware to parse JSON and URL-encoded data
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());// jahan v hmlog req.user =user kr rhe hai... ish line k wajah e.. cookie parser 

// User routes
app.use("/users", userRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

export { app };
