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
};

module.exports = schoolSettingService;
