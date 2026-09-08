const asyncHandler = require("../errorHandlers/asyncHandler");
const AppError = require("../utils/appError");
const superAdminService = require("../services/superAdminService");
const superAdminController = {
  createSidebar: asyncHandler(async (req, res) => {
    const { text, link, permission, children, order } = req.body;
    // Basic validation
    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Sidebar text is required",
      });
    }

    let childrenArray = [];

    if (children) {
      try {
        childrenArray = JSON.parse(children);
      } catch (error) {
        throw new AppError("Invalid children JSON", 400);
      }
    }

    // Validate image
    // if (!req.file) {
    //   new AppError("Sidebar image is required", 400);
    // }

    const imagePath = req.file ? `/uploads/sidebar/${req.file.filename}` : "";

    // Convert permission into array
    let permissionArray = [];

    if (permission) {
      if (Array.isArray(permission)) {
        permissionArray = permission ? permission.split(",").map(Number) : [];
      } else {
        permissionArray = permission.split(",").map(Number);
      }
    }

    const result = await superAdminService.createSidebar({
      text,
      link,
      image: imagePath,
      permission: permissionArray,
       children: childrenArray,
       order
    });
    res.status(201).json({
      success: true,
      message: "created sucesfully",
      data: result,
    });
  }),
  createBoard: asyncHandler(async (req, res) => {
    consle.log('board crated');
  })
};

module.exports = superAdminController;
