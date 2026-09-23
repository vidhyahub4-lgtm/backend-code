const mongoose = require("mongoose");

/*
 * Permanent admission record. Never changes when the student is promoted.
 * Class / section / roll no live in StudentEnrollment (one row per session).
 */
const studentAdmissionSchema = new mongoose.Schema(
  {
    schId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    admno: { type: String, required: true, trim: true },

    // registration holds all the personal / guardian info
    regno: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NewStudentRegistration",
      required: true,
    },

    admissionSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DevSuperSession",
      required: true,
    },

    admissionDate: { type: Date, default: Date.now },

    status: {
      type: String,
      enum: ["active", "left", "passed-out"],
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

// admno is unique per school, not globally
studentAdmissionSchema.index({ schId: 1, admno: 1 }, { unique: true });
// one registration can be admitted only once in a school
studentAdmissionSchema.index({ schId: 1, regno: 1 }, { unique: true });

module.exports = mongoose.models.StudentAdmission || mongoose.model("StudentAdmission", studentAdmissionSchema);