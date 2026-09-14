const asyncHandler = require("../errorHandlers/asyncHandler");
const AppError = require("../utils/appError");
const schoolSettingService = require("../services/schoolSettingService");
const schoolSettingController = {
  createSchClass: asyncHandler(async (req, res) => {
    const { schoolID, schCode, sectionID, classID } = req.body;
    console.log(schoolID, schCode, sectionID, classID);
    const userId = req.user._id;

    if (!schoolID || !schCode || !sectionID || !classID) {
      throw new AppError(
        "schinfo, schCode, session and class are required",
        400,
      );
    }

    const result = await schoolSettingService.createSchClass({
      schoolID,
      schCode,
      sectionID,
      classID,
      userId,
    });

    res.status(201).json({
      success: true,
      message: "School class and Section successfully",
      feeStructure: result,
    });
  }),

  getSchClass: asyncHandler(async (req, res) => {
    const { schoolID } = req.query;

    const result = await schoolSettingService.getSchClass({ schoolID });

    res.status(200).json({
      success: true,
      message: "School classes fetched successfully",
      schClasses: result,
    });
  }),

  createSchHouse: asyncHandler(async (req, res) => {
    const { house, schId } = req.body;
    const userId = req.user._id;

    if (!house || !schId) {
      throw new AppError("house, schId, session and class are required", 400);
    }

    const result = await schoolSettingService.createSchHouse({
      house,
      schId,
      userId,
    });

    res.status(201).json({
      success: true,
      message: "School House created successfully",
      schHouse: result,
    });
  }),

  getSchHouse: asyncHandler(async (req, res) => {
    const result = await schoolSettingService.getSchHouse();
    res.status(200).json({
      success: true,
      message: "School House fetched successfully",
      schClasses: result,
    });
  }),

  createFeePlanSetup: asyncHandler(async (req, res) => {
    const { headType, session, classes, schId } = req.body;
      const userId = req.user._id
    // Validation
    if (!headType) {
      throw new AppError("Head type is required", 400);
    }

    if (!session) {
      throw new AppError("Session is required", 400);
    }

    if (!schId) {
      throw new AppError("School ID is required", 400);
    }

    if (!classes || !Array.isArray(classes) || classes.length === 0) {
      throw new AppError("At least one class is required", 400);
    }

    // Validate classes
    for (const item of classes) {
      if (!item.classID) {
        throw new AppError("Class ID is required", 400);
      }

      if (
        item.amount === undefined ||
        item.amount === null ||
        Number(item.amount) < 0
      ) {
        throw new AppError("Valid amount is required for every class", 400);
      }
    }

    const feePlan = await schoolSettingService.createFeePlanSetup({
      headType,
      session,
      classes,
      schId,
      userId
    });

    res.status(201).json({
      success: true,
      message: "Fee plan setup created successfully",
      data: feePlan,
    });
  }),

  // Get All Fee Plan Setups
  getAllFeePlanSetups: asyncHandler(async (req, res) => {
    const { schId } = req.query;

    const feePlans = await schoolSettingService.getAllFeePlanSetups(schId);

    res.status(200).json({
      success: true,
      message: "Fee plan setups fetched successfully",
      count: feePlans.length,
      data: feePlans,
    });
  }),
};

module.exports = schoolSettingController;
