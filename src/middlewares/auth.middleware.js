import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  // Extract token from cookies or Authorization header
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  // Log the token for debugging
  console.log("Token:", token);

  // Check if token is present
  if (!token) {
    throw new ApiError(401, "Access Denied!!!");
  }

  try {
    // Verify token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Log the decoded token for debugging
    console.log("Decoded Token:", decodedToken);

    // Find user by ID
    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken",
    );

    // Check if user exists
    if (!user) {
      throw new ApiError(401, "Access Denied");
    }

    // Attach user to request object
    req.user = user;
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    // Handle token verification errors
    console.error("Token verification failed:", err.message);
    if (err.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid Token");
    }
    throw new ApiError(401, "Access Denied");
  }
});
