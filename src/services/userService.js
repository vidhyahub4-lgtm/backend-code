const User = require("../models/super-admin/userModel");
const AppError = require("../utils/appError");
const bcrypt = require("bcrypt");
const Sidebar = require("../models/super-admin/sidebar");
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
    schid,
  }) => {
    const existingUsername = await User.findOne({ loginUserName });

    if (existingUsername) {
      throw new AppError("Username already exists", 409);
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      throw new AppError("Email already exists", 409);
    }

    if (userType == "admin" && !schid) {
      throw new AppError("School is required for admin users", 400);
    }

    const hashpassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstname,
      lastname,
      loginUserName,
      email,
      phoneno,
      password: hashpassword,
      userType,
      image: image || "",
      schid: schid || null,
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
    }).populate({
      path: "schid",
      select: "_id schName  schLogo",
    });

    if (!user) {
      throw new AppError("Invalid username/email or password", 401);
    }


    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      throw new AppError("Invalid username/email or password", 401);
    }

    let accessToken = await generateAccessToken(user._id, user.userType);
    let refreshToken = await generateRefreshToken(user._id, user.userType);

    user.refreshToken = refreshToken;
    await user.save();
    console.log('user found : ', user)
    const userData = {
      id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      loginUserName: user.loginUserName,
      email: user.email,
      phoneno: user.phoneno,
      userType: user.userType,
      image: user.image,

      sch: user.schid
        ? {
            schid: user.schid._id,
            schoolName: user.schid.schName,
            schoolLogo: user.schid.schLogo,
          }
        : null,
    };

    let sidebar = [];

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
  getAllUsersService: async () => {
    const users = await User.find()
      .select("-password -refreshToken")
      .sort({ createdAt: -1 });
    return users;
  },
};

module.exports = userService;
