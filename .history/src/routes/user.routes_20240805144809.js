import express from "express";
import {
  loginInUser,
  registerUser,
  logoutUser,
  refreshAccessToken,
  updateAccountDetails,
} from "../controllers/user.controller.js";
import multer from "multer";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Use multer middleware to handle file uploads
router.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 5 },
  ]),
  registerUser,
);

router.route("/login").post(loginInUser);
// secured route with middleware injection
router.route("/logout").post(verifyJWT, logoutUser);

// route for refresh token
router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);

  router.route("/current-user").post(verifyJWT, getCurrentUser);

  router.route("/update-account").post(verifyJWT, updateAccountDetails);

  router.route("/update-avatar").post(verifyJWT, upload.single("avatar"), updateUserAvatar);

  router.route("/update-cover-image").post(
    verifyJWT,
    upload.array("coverImage", 5),
    updateUserCoverImage
  );
  router.route("/user/:id").get(verifyJWT, getUserChannelProfile);

  router.route("/user/:username").get(verifyJWT, getUserByUsername);


export default router;
