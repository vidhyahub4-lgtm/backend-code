const mongoose = require("mongoose");
const { Schema } = mongoose;

const STATUSES = ["present", "absent", "late", "leave"];

/**
 * One row per student whose attendance was changed on a PAST date.
 * `oldStatus: null`  -> no record existed before (first time marked)
 * `newStatus: null`  -> the student's record was removed
 * `batchId` groups every row written by a single "Save" click.
 */
const attendanceAuditLogSchema = new Schema(
  {
    batchId: { type: Schema.Types.ObjectId, required: true, index: true },

    schId: { type: Schema.Types.ObjectId, required: true },
    session: { type: String, required: true },
    class: { type: String, required: true },
    section: { type: String, required: true },
    attendanceDate: { type: Date, required: true }, // the day that was edited

    student: { type: Schema.Types.ObjectId, ref: "StudentEnrollment", required: true },
    // snapshots, so the log stays readable even if the student record changes later
    studentName: { type: String, default: "" },
    admno: { type: String, default: "" },
    rollNo: { type: Number, default: 0 },

    oldStatus: { type: String, enum: STATUSES, default: null },
    newStatus: { type: String, enum: STATUSES, default: null },

    // who did it (logged-in user) and for which class teacher
    changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    changedByName: { type: String, default: "" },
    changedByRole: { type: String, default: "" },
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher" },

    reason: { type: String, default: "", trim: true, maxlength: 300 },
    daysBack: { type: Number, required: true, min: 1 },
  },
  // `changedAt` = server time of the save; logs are never updated
  { timestamps: { createdAt: "changedAt", updatedAt: false } }
);

attendanceAuditLogSchema.index({
  schId: 1, session: 1, class: 1, section: 1, attendanceDate: 1, changedAt: -1,
});
attendanceAuditLogSchema.index({ student: 1, attendanceDate: -1 });
attendanceAuditLogSchema.index({ changedBy: 1, changedAt: -1 });

// Audit rows are append-only: block edits and deletes made through the model.
const IMMUTABLE_OPS = [
  "updateOne", "updateMany", "findOneAndUpdate", "findOneAndReplace",
  "replaceOne", "deleteOne", "deleteMany", "findOneAndDelete",
];
attendanceAuditLogSchema.pre(IMMUTABLE_OPS, function () {
  throw new Error("Attendance audit logs cannot be modified or deleted");
});

module.exports = mongoose.model("AttendanceAuditLog", attendanceAuditLogSchema);