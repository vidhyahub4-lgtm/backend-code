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
      order,
    });
    res.status(201).json({
      success: true,
      message: "created sucesfully",
      data: result,
    });
  }),
  createBoard: asyncHandler(async (req, res) => {
    // console.log('req.user : ', req.user)
    const userId = req.user._id;

    const { board, startMonth } = req.body;
    // console.log(board, startMonth, userId);
    if (!board || !startMonth || !userId) {
      throw new AppError("board, startMonth and userId are required", 400);
    }
    const result = await superAdminService.createBoard({
      board,
      startMonth,
      userId,
    });

    res.status(201).json({
      success: true,
      message: "Board created successfully",
      board: result,
    });
  }),
  getBoard: asyncHandler(async (req, res) => {
    const boards = await superAdminService.getBoard();
    res.status(200).json({
      success: true,
      message: "Boards fetched successfully",
      boards,
    });
  }),
  createInstituteType: asyncHandler(async (req, res) => {
    const { instituteType } = req.body;
    const userId = req.user._id;
    const result = await superAdminService.createInstituteType({
      instituteType,
      userId,
    });
    res.status(201).json({
      success: true,
      message: "Institute type created successfully",
      result,
    });
  }),

  getInstituteType: asyncHandler(async (req, res) => {
    const instituteTypes = await superAdminService.getInstituteType();
    res.status(200).json({
      success: true,
      message: "Institute types fetched successfully",
      instituteTypes,
    });
  }),

  createState: asyncHandler(async (req, res) => {
    const { stateName } = req.body;
    const userId = req.user._id;
    if (!stateName || !userId) {
      throw new AppError("stateName and userId are required", 400);
    }
    if (!stateName) {
      throw new AppError("State name is required", 400);
    }
    const result = await superAdminService.createState({
      stateName,
      userId,
    });

    res.status(201).json({
      success: true,
      message: "State created successfully",
      state: result,
    });
  }),

  getState: asyncHandler(async (req, res) => {
    const states = await superAdminService.getState();
    res.status(200).json({
      success: true,
      message: "States fetched successfully",
      states,
    });
  }),

  createCity: asyncHandler(async (req, res) => {
    const { cityName, stateId, pinCode } = req.body;
    const userId = req.user._id;
    if (!cityName || !stateId || !pinCode) {
      throw new AppError("cityName, stateId and pinCode are required", 400);
    }
    const result = await superAdminService.createCity({
      cityName,
      stateId,
      userId,
      pinCode,
    });
    res.status(201).json({
      success: true,
      message: "City created successfully",
      city: result,
    });
  }),

  getCity: asyncHandler(async (req, res) => {
    const cities = await superAdminService.getCity();
    res.status(200).json({
      success: true,
      message: "Cities fetched successfully",
      cities,
    });
  }),

  createClass: asyncHandler(async (req, res) => {
    const { className, classInWord } = req.body;
    const userId = req.user._id;
    if (!className || !classInWord) {
      throw new AppError("className and classInWord are required", 400);
    }
    const result = await superAdminService.createClass({
      className,
      classInWord,
      userId,
    });
    res.status(201).json({
      success: true,
      message: "Class created successfully",
      class: result,
    });
  }),

  getClass: asyncHandler(async (req, res) => {
    const classes = await superAdminService.getClass();
    res.status(200).json({
      success: true,
      message: "Classes fetched successfully",
      classes,
    });
  }),

  createSection: asyncHandler(async (req, res) => {
    const { sectionName, classId, Maxlimit } = req.body;
    const userId = req.user._id;

    if (!sectionName || !classId) {
      throw new AppError("sectionName and classId are required", 400);
    }

    const result = await superAdminService.createSection({
      sectionName,
      classId,
      userId,
      Maxlimit,
    });

    res.status(201).json({
      success: true,
      message: "Section created successfully",
      section: result,
    });
  }),

  getSection: asyncHandler(async (req, res) => {
    const sections = await superAdminService.getSection();
    res.status(200).json({
      success: true,
      message: "Sections fetched successfully",
      sections,
    });
  }),

  createSchool: asyncHandler(async (req, res) => {
    const {
      schName,
      schAdd,
      schInfo,
      cityId,
      stateId,
      schoolCode,
      websiteUrl,
      contact1,
      contact2,
      schemail,
      admin,
      selectBoard,
      instituteType,
    } = req.body;
    const userId = req.user._id;

    if (!req.file) {
      new AppError("school image is required", 400);
    }

    if (
      !schName ||
      !schemail ||
      !contact1 ||
      !cityId ||
      !stateId ||
      !schoolCode ||
      !admin ||
      !selectBoard ||
      !instituteType
    ) {
      throw new AppError(
        "schName, School email, contact1, city, state, schoolCode, admin, selectBoard and instituteType are required",
        400,
      );
    }

    const result = await superAdminService.createSchool({
      schName,
      schAdd,
      schInfo,
      cityId,
      stateId,
      schoolCode,
      websiteUrl,
      contact1,
      contact2,
      schemail,
      admin,
      selectBoard,
      instituteType,
      userId,
      schLogo: req.file ? req.file.path : "",
    });
    res.status(200).json({
      success: true,
      message: "school created successfully",
      result,
    });
  }),

  getSchool: asyncHandler(async (req, res) => {
    const schools = await superAdminService.getSchool();
    res.status(200).json({
      success: true,
      message: "Schools fetched successfully",
      schools,
    });
  }),

  createFeeStructure: asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { schId, schCode, session, feeStructure } = req.body;

    if (!schId || !schCode || !session || !feeStructure) {
      throw new AppError(
        "schId, schCode, session and feeStructure are required",
        400,
      );
    }
    const { doc, wasCreated } = await superAdminService.createFeeStructure({
      schId,
      schCode,
      session,
      feeStructure,
      userId,
    });
    res.status(wasCreated ? 201 : 200).json({
      success: true,
      message: wasCreated
        ? "Fee structure created successfully"
        : "New classes added to the existing session's fee structure",
      feeStructure: doc,
    });
  }),

  checkSchoolCode: asyncHandler(async (req, res) => {
    const { code } = req.body;
    const userId = req.user._id;

    if (!code) {
      throw new AppError("code is required", 400);
    }

    const result = await superAdminService.checkSchoolCode({ code, userId });

    res.status(200).json({
      success: true,
      message: result.available
        ? "School code is available"
        : "School code is already taken",
      available: result.available,
      code: result.code,
    });
  }),

  getSchoolPayMode: asyncHandler(async (req, res) => {
    const { schId, session } = req.query;

    const result = await superAdminService.getSchoolPayMode({ schId, session });

    res.status(200).json({
      success: true,
      message: "Pay mode setup fetched successfully",
      feeStructure: result,
    });
  }),

  updateFeeStructureEntry: asyncHandler(async (req, res) => {
    const { setupId, entryId, duration, payModeDuration, installment } =
      req.body;

    if (!setupId || !entryId) {
      throw new AppError("setupId and entryId are required", 400);
    }

    const result = await superAdminService.updateFeeStructureEntry({
      setupId,
      entryId,
      duration,
      payModeDuration,
      installment,
    });

    res.status(200).json({
      success: true,
      message: "Fee structure entry updated successfully",
      feeStructure: result,
    });
  }),

  feeheadsetup: asyncHandler( async (req, res)=>{
    const {headtype, session, feehead} = req.body
    const userId = req.user._id

    if(!headtype || !session || !feehead){
      throw new AppError("headtype, session and feehead are required", 400)
    }

    let result = await superAdminService.createfeeheadSetup({
      headtype, session, feehead, userId
    })
    res.status(201).json({
      success: true,
      message: "Fee created successfully",
      feeStructure: result,
    });
  }),


  feeplantype: asyncHandler( async (req, res)=>{
    const {plan} = req.body;
    const userId = req.user._id;

    const result = await superAdminService.createfeeplantype({
      plan, userId
    })
   res.status(201).json({
      success: true,
      message: "Fee created successfully",
      feeStructure: result,
    });
  }),

    getFeeHeadSetup: asyncHandler(async (req, res) => {
    const feeHeads = await superAdminService.getFeeHeadSetup();
    res.status(200).json({
      success: true,
      message: "Fee heads fetched successfully",
      feeHeads,
    });
  }),

  getFeePlanType: asyncHandler(async (req, res) => {
    const feePlans = await superAdminService.getFeePlanType();
    res.status(200).json({
      success: true,
      message: "Fee plan types fetched successfully",
      feePlans,
    });
  }),

  // createSession: asyncHandler(async (req, res) => {
  //   const { session } = req.body;
  //   const userId = req.user._id;
  //   if (!session) {
  //     throw new AppError("session is required", 400);
  //   }
  //   const result = await superAdminService.createSession({ session, userId });
  //   res.status(201).json({
  //     success: true,
  //     message: "Session created successfully",
  //     session: result,
  //   });
  // }),

  // getSession: asyncHandler(async (req, res) => {
  //   const sessions = await superAdminService.getSession();
  //   res.status(200).json({
  //     success: true,
  //     message: "Sessions fetched successfully",
  //     sessions,
  //   });
  // }),
};

module.exports = superAdminController;
