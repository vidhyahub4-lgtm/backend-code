const StudentAdmission = require("../models/school-setting/Studentadmission");
const StudentEnrollment = require("../models/school-setting/Studentenrollment");

module.exports = {
  getAllStudentofClass: async ({ classId, sectionId }) => {
    const filter = {
      classID: classId,
      status: "active",
    };

    // Only filter by section when frontend provides it
    if (sectionId) {
      filter.sectionId = sectionId;
    }

    const studentlist = await StudentEnrollment.find(filter)
       .populate({
    path: "studentId",
    populate: {
      path: "regno",
      model: "NewStudentRegistration",
    },
  })
      .populate({
        path: "classID",
        select: "className classInWord",
      })
      .populate({
        path: "sectionId",
        select: "sectionName",
      })
      .sort({ rollNo: 1 });

    return studentlist;
  },
};
