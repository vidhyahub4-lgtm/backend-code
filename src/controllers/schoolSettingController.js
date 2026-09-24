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

  // Get All Fee Plan Setups
  createFeePlanSetup: asyncHandler(async (req, res) => {
    const { headType, session, schId, classes } = req.body;

    const userId = req.user._id;

    if (!headType) {
      throw new AppError("Head type is required", 400);
    }

    if (!session) {
      throw new AppError("Session is required", 400);
    }

    if (!schId) {
      throw new AppError("School ID is required", 400);
    }

    // if (classes !== undefined && !Array.isArray(classes)) {
    //   throw new AppError("Classes must be an array", 400);
    // }

    // if (classes && classes.length > 0) {
    //   for (const item of classes) {
    //     if (!item.classID) {
    //       throw new AppError("Class ID is required", 400);
    //     }

    //     if (
    //       item.amount !== undefined &&
    //       item.amount !== null &&
    //       Number(item.amount) < 0
    //     ) {
    //       throw new AppError("Amount cannot be negative", 400);
    //     }
    //   }
    // }

    const feePlan = await schoolSettingService.createFeePlanSetup({
      headType,
      session,
      classes,
      schId,
      userId,
    });

    res.status(201).json({
      success: true,
      message: "Fee plan setup created successfully",
      data: feePlan,
    });
  }),

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

  updateFeePlanSetup: asyncHandler(async (req, res) => {
    const { planId } = req.params;
    const { headType, schId, classes } = req.body;

    if (!headType || !schId) {
      throw new AppError("headType and schId are required", 400);
    }

    const data = await schoolSettingService.updateFeePlanSetup({
      planId,
      headType,
      schId,
      classes,
    });

    res.status(200).json({
      success: true,
      message: "Fee plan updated successfully",
      data,
    });
  }),

  createNewRegistration: asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const data = {
      ...req.body,
      Image: req.file ? req.file.filename : "",
    };
    const registration = await schoolSettingService.createNewRegistration(
      userId,
      data,
    );

    return res.status(201).json({
      success: true,
      message: "New Student registration successfully",
      data: registration,
    });
  }),

  feeheadsetup: asyncHandler(async (req, res) => {
    const { headtype, session, feehead, schId } = req.body;
    const userId = req.user._id;

    if (!headtype || !session || !feehead || !schId) {
      throw new AppError(
        "headtype, session, feehead and schId are required",
        400,
      );
    }

    let result = await schoolSettingService.createfeeheadSetup({
      headtype,
      session,
      feehead,
      userId,
      schId,
    });

    res.status(201).json({
      success: true,
      message: "Fee head created successfully",
      feeStructure: result,
    });
  }),

  feeplantype: asyncHandler(async (req, res) => {
    const { plan, schId } = req.body;
    if (!plan || !schId) throw new AppError("plan and schId are required", 400);
    const userId = req.user._id;

    const result = await schoolSettingService.createfeeplantype({
      plan,
      userId,
      schId,
    });
    res.status(201).json({
      success: true,
      message: "Fee created successfully",
      feeStructure: result,
    });
  }),

  getFeeHeadSetup: asyncHandler(async (req, res) => {
    const { schId } = req.query;
    if (!schId) {
      throw new AppError(" schId is required", 400);
    }

    const feeHeads = await schoolSettingService.getFeeHeadSetup({ schId });

    res.status(200).json({
      success: true,
      message: "Fee heads fetched successfully",
      feeHeads,
    });
  }),

  getFeePlanType: asyncHandler(async (req, res) => {
    const { schId } = req.query;
    if (!schId) throw new AppError("schId is required", 400);
    const feePlans = await schoolSettingService.getFeePlanType({ schId });
    res.status(200).json({
      success: true,
      message: "Fee plan types fetched successfully",
      feePlans,
    });
  }),

  getAllNewRegistration: asyncHandler(async (req, res) => {
    const { schId } = req.query;
    const getAllNewRegistration = await schoolSettingService.getAlNewReg(schId);
    res.status(200).json({
      success: true,
      message: "All New Registration fetched successfully",
      count: getAllNewRegistration.length,
      data: getAllNewRegistration,
    });
  }),

  getRegisterStudentByID: asyncHandler(async (req, res) => {
    const { regno, schId } = req.body;

    const getNewRegistrationbyid = await schoolSettingService.getAlNewRegbyid({
      regno,
      schId,
    });

    if (!getNewRegistrationbyid) {
      return res.status(404).json({
        success: false,
        message: `Registered student with regno ${regno} not found`,
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      message: `Register Student data with regno ${regno} fetched successfully`,
      data: getNewRegistrationbyid,
    });
  }),

  admitStudent: asyncHandler(async (req, res) => {
    const {
      schId,
      regno,
      admno,
      session,
      classID,
      sectionId,
      rollNo,
      admissionDate,
    } = req.body;

    if (!regno || !admno || !session || !classID || !sectionId) {
      throw new AppError(
        "regno, admno, session, classID and sectionId are required",
        400,
      );
    }

    const data = await schoolSettingService.admitStudent({
      schId, // from the logged-in user, never from the body
      userId: req.user._id,
      regno,
      admno,
      session,
      classID,
      sectionId,
      rollNo,
      admissionDate,
    });

    res.status(201).json({
      success: true,
      message: "Student admitted successfully",
      data,
    });
  }),

  listEnrollments: asyncHandler(async (req, res) => {
    const { schId, session, classID, sectionId } = req.query;

    if (!session) throw new AppError("session is required", 400);

    const data = await schoolSettingService.listEnrollments({
      schId,
      session,
      classID,
      sectionId,
    });

    res.status(200).json({ success: true, count: data.length, data });
  }),
};

module.exports = schoolSettingController;
