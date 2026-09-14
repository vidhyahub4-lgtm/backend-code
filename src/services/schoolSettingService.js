const SchClass = require("../models/school-setting/schoolClass");
const SchHouse = require("../models/school-setting/schhouse");
const FeePlanSetup = require("../models/school-setting/feeplansetup");
const schoolSettingService = {
  createSchClass: async ({ schoolID, schCode, sectionID, classID, userId }) => {
    let newSchclass = new SchClass({
      schoolID,
      schCode,
      sectionID,
      classID,
      createdBy: userId,
    });
    return await newSchclass.save();
  },

  getSchClass: async ({ schoolID }) => {
    const filter = schoolID ? { schoolID } : {};
    return await SchClass.find(filter)
      .populate("classID", "className classInWord")
      .populate("sectionID", "sectionName Maxlimit")
      .populate("schoolID", "schName schoolCode")
      .sort({ createdAt: -1 });
  },

  createSchHouse: async ({ house, schId, userId }) => {
    const schHouse = new SchHouse({
      house,
      schId,
      createdby: userId,
    });

    return await schHouse.save();
  },

  getSchHouse: async () => {
    return await SchHouse.find().sort({ createdAt: -1 });
  },
  createFeePlanSetup: async (data) => {
    const { headType, session, classes, schId, userId } = data;

    const existingFeePlan = await FeePlanSetup.findOne({
      headType,
      session,
      schId,
    });

    if (existingFeePlan) {
      return existingFeePlan;
    }

    const feePlan = await FeePlanSetup.create({
      headType,
      session,
      classes,
      schId,
      createdby: userId,
    });

    return feePlan;
  },

  getAllFeePlanSetups: async (schId) => {
    const filter = {};

    if (schId) {
      filter.schId = schId;
    }

    const feePlans = await FeePlanSetup.find(filter)
      .populate({
        path:"session",
        "select":"session"
      })
      .populate({
        path:"classes.classID",
        select:'className classInWord'
      })
      .populate({
        path: "schId",
        select: "schName schoolCode",
      })
      .sort({ createdAt: -1 });

    return feePlans;
  },
};

module.exports = schoolSettingService;
