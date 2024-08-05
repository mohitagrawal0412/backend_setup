import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { response } from "express";

// generate acccess and refresh token funciton because we gonna use it many times
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating access and refresh token",
    );
  }
};

/// register user Controller
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, userName, password } = req.body;
  console.log(email);

  // Validate input fields
  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if user already exists
  const existedUser = await User.findOne({
    $or: [{ email }, { userName }],
  });
  if (existedUser) {
    throw new ApiError(400, "Email or username already exists");
  }

  // Check for avatar and cover image uploads
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  // agar cover image upload nhi krega phir v register hona chaye ,, avatarlocalfilepath wala
  // mandatory hai to ushka process sahi hai
  // coverimagelocalpath k liye classic if else lga skte h
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  }

  if (!avatarLocalPath) throw new ApiError(400, "Please upload avatar");

  // Upload images to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  if (!avatar) throw new ApiError(400, "Failed to upload avatar");

  // Create new user
  const newUser = new User({
    fullName,
    email,
    userName,
    password,
    avatar: avatar.secure_url,
    coverImage: coverImage ? coverImage.secure_url : null,
  });

  await newUser.save();

  // Fetch created user without password and refreshToken
  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken",
  );
  if (!createdUser)
    throw new ApiError(500, "Something went wrong while registering user");

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

// login user controller
const loginInUser = asyncHandler(async (req, res) => {
  // take value of email and username and password from body
  const { email, userName, password } = req.body;

  // we can login through username or email , either of two
  if (!userName && !email)
    throw new ApiError(400, "Username or email is required");

  // get user from db by finding it from db
  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  // checking we got user or not
  if (!user) throw new ApiError(400, "User not found");

  // now checking password, after confirming username or email
  const isPasswordValid = await user.isPasswordCorrect(password);
  console.log("Entered Password: ", password);
  console.log("Stored Hashed Password: ", user.password);
  console.log("Is Password Valid: ", isPasswordValid);

  // confirm password
  if (!isPasswordValid)
    throw new ApiError(401, "Invalid user credentials, password is wrong");

  // generate access token and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  const loggedInuser = await User.findById(user._id).select(
    "-password -refresh-token",
  );

  // options to provide security
  const options = {
    httpOnly: true,
    secure: true,
  };

  // return response with cookies
  return res
    .status(200)
    .cookie("access-token", accessToken, options)
    .cookie("refresh-token", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInuser,
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
        "User logged in successfully",
      ),
    );
});
// logout user controller

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    // ye apne ko  {req.user} mila , middleware se , jo logout route me
    // use kiye hai verifyJWT , jahan apan req.user=user kiye token k madad se
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true },
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "User logged out successfully"));
});
// refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
  // taking incoming refresh token from either cookkies or postman body
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  // check , either we got not not
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorised request");
  }
  // now decode refresh token , with our refresh token secret
  const decodedRefreshToken = jwt.verify(
    incomingRefreshToken,
    // apne se verify jwt me token dekhna hai
    // refresh token ko verify karne se jwt verify me jisme secret key hai
    process.env.REFRESH_TOKEN_SECRET,
  );

  // now decoded refresh token contain our id , as we send it in refresh token
  // search for user from that id
  const user = await User.findById(decodedRefreshToken?._id);

  if (!user)
    throw new ApiError(
      403,
      "invalid refresh token , no user has been logged in",
    );
  // if incoming refresh token is not equal to user refreshToken means it has been expired
  if (incomingRefreshToken !== user?.refreshToken)
    throw new ApiError(403, "REFRESH Token has been expired");

  // securiy check for
  const options = {
    httpOnly: true,
    secure: true,
  };
  // making new access and refresh token
  const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );
  // retrning respose
  return res
    .status(200)
    .cookie("access-token", accessToken, options)
    .cookie("refresh-token", newRefreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: user,
          accessToken: accessToken,
          refreshToken: newRefreshToken,
        },
        "User logged in successfully",
      ),
    );
});
// change current password function
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) throw new ApiError(400, "Old password is incorrect");
  // idea this can also ne done like that
  // if(!user.isPasswordCorrect(oldPassword)){
  //   throw new ApiError(400,"Old password is incorrect")
  // }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

// get current user details
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "current user fetched successfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) throw new ApiError(400, "All fields are required");

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
        // idea: email:email v kr skte h
      },
    },
    { new: true },
  ).select("-password");

  return res.status(200).json(new ApiResponse(200,)
});

export {
  registerUser,
  loginInUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
};
