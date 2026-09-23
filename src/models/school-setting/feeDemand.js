const mongoose = require("mongoose");

/*
 * What a student OWES. Generated from FeePlanSetup:
 *  - admission / promotion / misc heads: one row per fee head
 *  - monthly heads: one row per fee head per instalment month
 *
 * planAmount is COPIED from the plan, so changing the plan later
 * never rewrites history.
 *
 * Due = netAmount - paidAmount (derived, not stored).
 */
const feeDemandSchema = new mongoose.Schema(
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

    // class at the time the demand was raised
    classID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    feePlanId: { type: mongoose.Schema.Types.ObjectId, ref: "FeePlanSetup" },

    headType: {
      type: String,
      enum: ["admission", "promotion", "monthly", "Misc", "special ocassion"],
      required: true,
    },

    feetype: { type: String, required: true, trim: true },

    // only for monthly heads. This is the _id of the embedded installment
    // sub-document inside SchoolPayModeSetup.feeStructure[].installment[] —
    // not a separate collection, so no `ref` here. To show the month name,
    // look it up: SchoolPayModeSetup.feeStructure[].installment
    //               .find(i => i._id.equals(installmentMonthId))
    installmentMonthId: {
      type: Number,
      required: true,
    },

    installmentMonthNo: {
      type: Number,
      required: true,
    },

    planAmount: { type: Number, required: true, min: 0 },
    concession: { type: Number, default: 0, min: 0 },
    netAmount: { type: Number, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },

    status: {
      type: String,
      enum: ["unpaid", "partial", "paid", "cancelled"],
      default: "unpaid",
    },

    createdby: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// keep netAmount and status consistent whenever a demand is saved
feeDemandSchema.pre("validate", function (next) {
  if (this.concession > this.planAmount) {
    return next(new Error("Concession cannot exceed the plan amount"));
  }

  this.netAmount = this.planAmount - this.concession;

  if (this.paidAmount > this.netAmount) {
    return next(new Error("Paid amount cannot exceed the net amount"));
  }

  if (this.status !== "cancelled") {
    if (this.paidAmount === 0)
      this.status = this.netAmount === 0 ? "paid" : "unpaid";
    else if (this.paidAmount < this.netAmount) this.status = "partial";
    else this.status = "paid";
  }

  next();
});

// the same fee can never be charged twice to a student
feeDemandSchema.index(
  { studentId: 1, session: 1, headType: 1, feetype: 1, installmentMonthId: 1 },
  { unique: true },
);

// dues reports
feeDemandSchema.index({ schId: 1, session: 1, classID: 1, status: 1 });
feeDemandSchema.index({ schId: 1, session: 1, studentId: 1 });

module.exports =
  mongoose.models.FeeDemand || mongoose.model("FeeDemand", feeDemandSchema);
