const mongoose = require("mongoose");

/*
 * One row per student per session.
 * Promotion = create a new row for the next session, never edit the old one.
 */
const studentEnrollmentSchema = new mongoose.Schema(
  {
    schId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DevSuperSession",
      required: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentAdmission",
      required: true,
    },

    classID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    // adjust ref to your real section model name
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },

    rollNo: { type: Number, min: 0, default:0 },

    status: {
      type: String,
      enum: ["active", "promoted", "left"],
      default: "active",
    },

    createdby: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// a student has one enrollment per session
studentEnrollmentSchema.index({ studentId: 1, session: 1 }, { unique: true });

// roll no unique inside class + section + session (only when a roll no is set)
studentEnrollmentSchema.index(
  { schId: 1, session: 1, classID: 1, sectionId: 1, rollNo: 1 },
  { unique: true, partialFilterExpression: { rollNo: { $type: "number" } } },
);

// class-wise student lists
studentEnrollmentSchema.index({ schId: 1, session: 1, classID: 1, sectionId: 1 });

module.exports =  mongoose.models.StudentEnrollment || mongoose.model("StudentEnrollment", studentEnrollmentSchema);