const mongoose = require("mongoose");
const { Schema } = mongoose;

const STATUSES = ["present", "absent", "late", "leave"];

// One entry per student inside a day's document (no _id of its own: the
// student reference is the identifier).
const recordSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "StudentEnrollment",
      required: true,
    },
    status: { type: String, enum: STATUSES, required: true },
    rollNo: { type: Number, default: 0 },
    remark: { type: String, default: "", trim: true },
  },
  { _id: false }
);

/**
 * ONE document per class-section per day (instead of one per student per day).
 * A class of 40 now costs 1 document a day instead of 40.
 */
const attendanceSchema = new Schema(
  {
    schId: { type: Schema.Types.ObjectId, required: true, index: true },
    session: { type: String, required: true },
    class: { type: String, required: true },
    section: { type: String, required: true },
    date: { type: Date, required: true }, // normalised to 00:00 by the service
    records: { type: [recordSchema], default: [] },
    markedBy: { type: Schema.Types.ObjectId, ref: "Teacher" },
  },
  { timestamps: true }
);

// one document per class-section per day (also makes the upsert in markAttendance safe)
attendanceSchema.index(
  { schId: 1, session: 1, class: 1, section: 1, date: 1 },
  { unique: true }
);

// "show me this student's attendance" (reports) without scanning every day
attendanceSchema.index({ "records.student": 1, date: -1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
module.exports.STATUSES = STATUSES;