const mongoose = require("mongoose");
const { Schema } = mongoose;

const attendanceSchema = new Schema(
  {
    schId: { type: Schema.Types.ObjectId, required: true, index: true },
    session: { type: String, required: true },
    class: { type: String, required: true },
    section: { type: String, required: true },
    date: { type: Date, required: true }, // normalised to 00:00 by the service
    student: {
      type: Schema.Types.ObjectId,
      ref: "StudentEnrollment",
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "leave"],
      required: true,
    },
    remark: { type: String, default: "", trim: true },
    markedBy: { type: Schema.Types.ObjectId, ref: "Teacher" },
  },
  { timestamps: true }
);

// one record per student per day (also makes the upsert in markAttendance safe)
attendanceSchema.index(
  { schId: 1, session: 1, class: 1, section: 1, date: 1, student: 1 },
  { unique: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);