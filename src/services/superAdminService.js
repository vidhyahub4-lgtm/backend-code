const Sidebar = require("../models/super-admin/sidebar");
const { uploadImageToCloudflare } = require("./cloudflare.service");
const Board = require("../models/super-admin/board");
const InstituteType = require("../models/super-admin/instituteType");
const State = require("../models/super-admin/state");
const City = require("../models/super-admin/city");
const Class = require("../models/super-admin/class");
const Section = require("../models/super-admin/section");
const School = require("../models/super-admin/schoolModels");
const SchoolPayModeSetup = require("../models/super-admin/SchoolPayModeSetup");
const SchoolCode = require("../models/super-admin/schoolCode");

const Session = require("../models/dev_super/session");
const LateFineSetup = require("../models/super-admin/lateFineSetup");

const superAdminService = {
  createSidebar: async ({ text, link, image, permission, children, order }) => {
    // if (!image) {
    //   throw new Error("Sidebar image is required");
    // }

    // 2. Upload image to Cloudflare
    // const cloudflareImage = await uploadImageToCloudflare(file);

    // 3. Get Cloudflare image URL
    // const imageUrl = cloudflareImage.variants?.[0];
    const sidebar = new Sidebar({
      text,
      link,
      icon: image,
      permission,
      children: children || [],
      order,
    });
    return await sidebar.save();
  },

  createBoard: async ({ board, startMonth, userId }) => {
    const newBoard = new Board({
      boardName: board,
      startMonth,
      createdBy: userId,
    });
    return await newBoard.save();
  },
  getBoard: async () => {
    return await Board.find();
  },

  createInstituteType: async ({ instituteType, userId }) => {
    const newInstituteType = new InstituteType({
      instituteType,
      createdBy: userId,
    });
    return await newInstituteType.save();
  },

  getInstituteType: async () => {
    return await InstituteType.find();
  },

  createState: async ({ stateName, userId }) => {
    const newState = new State({
      stateName,
      createdBy: userId,
    });
    return await newState.save();
  },

  // createSession: async ({ session, userId }) => {
  //   const newSession = new Session({
  //     session,
  //     createdBy: userId,
  //   });
  //   return await newSession.save();
  // },

  // getSession: async () => {
  //   return await Session.find().sort({ createdAt: -1 });
  // },

  getState: async () => {
    return await State.find();
  },

  createCity: async ({ cityName, stateId, userId, pinCode }) => {
    const newCity = new City({
      cityName,
      stateId,
      createdBy: userId,
      pinCode,
    });
    return await newCity.save();
  },

  getCity: async () => {
    return await City.find()
      .populate("stateId", "State")
      .select("-createdAt -updatedAt");
  },

  createClass: async ({ className, classInWord, userId }) => {
    const newClass = new Class({
      className,
      classInWord,
      createdBy: userId,
    });
    return await newClass.save();
  },

  getClass: async () => {
    return await Class.find().select("-createdAt -updatedAt");
  },

  createSection: async ({ sectionName, classId, userId, Maxlimit }) => {
    const newSection = new Section({
      sectionName,
      classId,
      createdBy: userId,
      Maxlimit,
    });
    return await newSection.save();
  },

  getSection: async () => {
    return await Section.find()
      .populate("classId", "className")
      .select("-createdAt -updatedAt");
  },

  createSchool: async ({
    schName,
    schAdd,
    schInfo,
    cityId,
    stateId,
    schoolCode,
    websiteUrl,
    contact1,
    contact2,
    email,
    schemail,
    selectBoard,
    instituteType,
    schLogo,
    userId,
    admin,
  }) => {
    const newSchool = new School({
      schName,
      schAdd,
      schInfo,
      cityId,
      stateId,
      schoolCode,
      websiteUrl,
      contact1,
      contact2,
      email,
      schemail,
      selectBoard,
      instituteType,
      schLogo,
      admin,
      createdBy: userId,
    });
    return await newSchool.save();
  },

  getSchool: async () => {
    return await School.find()
      .populate("cityId", "cityName")
      .populate("stateId", "stateName")
      .populate("selectBoard", "boardName")
      .populate("instituteType", "instituteType")
      .select("-createdAt ");
  },

  // Upsert: if this school + session already has a setup, only append
  // classes that aren't already in its feeStructure (skip duplicates).
  // If no setup exists yet for this school + session, create a fresh one.
  createFeeStructure: async ({
    schId,
    schCode,
    session,
    feeStructure,
    userId,
  }) => {
    const existing = await SchoolPayModeSetup.findOne({ schId, session });

    if (!existing) {
      const newFeeStructure = new SchoolPayModeSetup({
        schId,
        schCode,
        session,
        feeStructure,
        createdBy: userId,
      });
      const saved = await newFeeStructure.save();
      return { doc: saved, wasCreated: true };
    }

    const existingClassIds = new Set(
      existing.feeStructure.map((entry) => String(entry.class)),
    );
    const newEntries = feeStructure.filter(
      (entry) => !existingClassIds.has(String(entry.class)),
    );

    if (newEntries.length === 0) {
      const err = new Error(
        "All selected classes already have a fee structure for this session.",
      );
      err.statusCode = 409;
      throw err;
    }

    existing.feeStructure.push(...newEntries);
    const saved = await existing.save();
    return { doc: saved, wasCreated: false };
  },

  checkSchoolCode: async ({ code, userId }) => {
    const normalized = (code || "").trim().toUpperCase();
    const codePattern =
      /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%*])[A-Z0-9!@#$%*]{8}$/;

    if (!codePattern.test(normalized)) {
      const err = new Error(
        "School code must be 8 characters with at least one letter, one number, and one special character (!@#$%*)",
      );
      err.statusCode = 400;
      throw err;
    }

    try {
      await SchoolCode.create({ code: normalized, createdBy: userId });
      return { code: normalized, available: true };
    } catch (error) {
      if (error.code === 11000) {
        return { code: normalized, available: false };
      }
      throw error;
    }
  },

  getSchoolPayMode: async ({ schId, session }) => {
    const filter = {};
    if (schId) filter.schId = schId;
    if (session) filter.session = session;

    return await SchoolPayModeSetup.find(filter)
      .populate("schId", "schName schoolCode")
      .populate("feeStructure.class", "className classInWord")
      .sort({ createdAt: -1 });
  },

  updateFeeStructureEntry: async ({
    setupId,
    entryId,
    duration,
    payModeDuration,
    installment,
  }) => {
    const update = {};
    if (duration !== undefined) update["feeStructure.$.duration"] = duration;
    if (payModeDuration !== undefined)
      update["feeStructure.$.payModeDuration"] = payModeDuration;
    if (installment !== undefined)
      update["feeStructure.$.installment"] = installment;

    const result = await SchoolPayModeSetup.findOneAndUpdate(
      { _id: setupId, "feeStructure._id": entryId },
      { $set: update },
      { new: true },
    )
      .populate("schId", "schName schoolCode")
      .populate("feeStructure.class", "className classInWord");

    if (!result) {
      const err = new Error("Pay mode setup or class entry not found");
      err.statusCode = 404;
      throw err;
    }
    return result;
  },



  createSession: async ({ session }) => {
    const newSession = new Session({
      session,
    });
    return await newSession.save();
  },

  getSession: async () => {
    return await Session.find().sort({ createdAt: -1 });
  },

  createLateFineSetup: async (data) => {
    const lateFineSetup = await LateFineSetup.create(data);

    return lateFineSetup;
  },

  getLateFineSetups: async () => {
    const data = await LateFineSetup.find()
      .populate({
        path: "session",
        select: "session",
      })
      .populate({
        path: "class",
        select: "classID sectionID ",
        populate: [
          {
            path: "classID",
            select: "className classInWord",
          },
          {
            path: "sectionID",
            select: "sectionName",
          },
        ],
      })
      .populate({
        path: "schId",
        select: "schName schAdd",
      });

    return data;
  },
};

module.exports = superAdminService;
