const AppError = require("../utils/appError");

const superAdminMiddleware = (req, res, next) => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  if (req.user.userType !== "superAdmin") {
    throw new AppError("Access denied. SuperAdmin Can Create Boards only.", 403);
  }

  next();
};

module.exports = superAdminMiddleware;
