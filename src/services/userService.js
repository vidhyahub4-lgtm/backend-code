const User = require("../models/userModel");
const AppError = require("../utils/appError");
const bcrypt = require("bcrypt");
const Sidebar = require("../models/sidebar");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateTokens");
const userService = {
  createUserService: async ({
    firstname,
    lastname,
    loginUserName,
    email,
    phoneno,
    password,
    userType,
    image,
  }) => {
    const existingUsername = await User.findOne({ loginUserName });

    if (existingUsername) {
      throw new AppError("Username already exists", 409);
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      throw new AppError("Email already exists", 409);
    }

    const hashpassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      firstname,
      lastname,
      loginUserName,
      email,
      phoneno,
      password: hashpassword,
      userType,
      image: image || "",
    });

    return user;
  },
  loginUserService: async ({ loginUserName, email, password }) => {
    // Find user using username OR email
    const user = await User.findOne({
      $or: [
        ...(loginUserName ? [{ loginUserName }] : []),
        ...(email ? [{ email }] : []),
      ],
    });

    if (!user) {
      throw new AppError("Invalid username/email or password", 401);
    }

    // Compare password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      throw new AppError("Invalid username/email or password", 401);
    }

    // Don't return password to controller/client
    const userData = {
      id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      loginUserName: user.loginUserName,
      email: user.email,
      phoneno: user.phoneno,
      userType: user.userType,
      image: user.image,
    };

    let accessToken = await generateAccessToken(user._id, user.userType);
    let refreshToken = await generateRefreshToken(user._id, user.userType);

    user.refreshToken = refreshToken;
    await user.save();

    const userObject = user.toObject();
    delete userObject.refreshToken;

    let sidebar;

    if (user.userType === "superAdmin") {
      sidebar = await Sidebar.find({
        permission: 1,
        isActive: true,
      }).sort({ order: 1 });
    } else if (user.userType === "admin") {
      sidebar = await Sidebar.find({
        permission: 0,
        isActive: true,
      }).sort({ order: 1 });
    }

    return {
      user: userData,
      sidebar,
      accessToken,
    };
  },
};

module.exports = userService;
