import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
  console.log("Register user route hit"); // Logging for debugging
  res.status(200).json({
    message: "ok",
  });
});

export { registerUser };
