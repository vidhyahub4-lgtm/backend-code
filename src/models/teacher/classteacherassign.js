const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * ClassTeacherAssignment
 * A dedicated collection (rather than just a flag on Teacher) so that:
 *  - "who is the class teacher of Class 5 - A this session" is a single indexed lookup
 *  - the unique index guarantees only one class teacher per class+section+session+school
 */
const classTeacherAssignmentSchema = new Schema(
  {
    schId: { type: Schema.Types.ObjectId, required: true, index: true },
    session: { type: String, required: true }, // '2026-27'
    class: { type: String, required: true },
    section: { type: String, required: true },
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    assignedBy: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

// one class teacher per class-section per session per school
classTeacherAssignmentSchema.index(
  { schId: 1, session: 1, class: 1, section: 1 },
  { unique: true }
);

module.exports = mongoose.model("ClassTeacherAssignment", classTeacherAssignmentSchema);