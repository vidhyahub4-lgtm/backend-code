const asyncHandler = require("../errorHandlers/asyncHandler");
const AppError = require("../utils/appError");
const userService = require("../services/userService");

const userController = {
  createUser: asyncHandler(async (req, res) => {
    const {
      firstname,
      lastname,
      loginUserName,
      email,
      phoneno,
      password,
      userType,
      image,
    } = req.body;

    if (!email || !password || !phoneno) {
      throw new AppError("email, password, phoneno is required", 400);
    }

    const result = await userService.createUserService({
      firstname,
      lastname,
      loginUserName,
      email,
      phoneno,
      password,
      userType,
      image, // optional
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: result,
    });
  }),

  
  loginUser: asyncHandler(async (req, res) => {
    const { loginUserName, email, password } = req.body;
    console.log(loginUserName, email, password);

    if (!password) {
      throw new AppError("Password is required", 400);
    }

    if (!loginUserName && !email) {
      throw new AppError("loginUserName or email is required", 400);
    }

    const { user, sidebar ,accessToken} = await userService.loginUserService({
      loginUserName,
      email,
      password,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      data: { user, sidebar },
    });
  
  }),
};

module.exports = userController;
