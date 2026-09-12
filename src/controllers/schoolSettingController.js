const asyncHandler = require("../errorHandlers/asyncHandler");
const AppError = require("../utils/appError");
const schoolSettingService = require("../services/schoolSettingService");
const schoolSettingController = {
  createSchClass: asyncHandler(async (req, res) => {
    const { schoolID, schCode, sectionID, classID } = req.body;
    console.log(schoolID, schCode, sectionID, classID)
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
};

module.exports = schoolSettingController;