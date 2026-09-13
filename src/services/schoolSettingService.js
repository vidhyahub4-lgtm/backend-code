const SchClass = require("../models/school-setting/schoolClass");
const SchHouse = require("../models/school-setting/schhouse");
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
    return await SchHouse.find()
      .sort({ createdAt: -1 });
  },
};

module.exports = schoolSettingService;
