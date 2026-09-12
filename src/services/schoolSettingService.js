const SchClass = require("../models/schoolClass");
const schoolSettingService = {
  createSchClass: async ({ schoolID, schCode, sectionID, classID, userId }) => {
    let newSchclass = new SchClass({
      schoolID,
      schCode,
      sectionID,
      classID,
      createdBy:userId,
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
};

module.exports = schoolSettingService;