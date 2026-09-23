const mongoose = require("mongoose");

/*
 * Student advance / credit as a ledger, not a stored balance.
 * Balance = sum(credit) - sum(debit) for the student.
 *
 * credit: parent paid extra (advance)
 * debit : advance adjusted against a later demand, or refunded
 */
const feeCreditLedgerSchema = new mongoose.Schema(
  {
    schId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentAdmission",
      required: true,
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DevSuperSession",
      required: true,
    },

    type: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true, min: 0.01 },

    receiptId: { type: mongoose.Schema.Types.ObjectId, ref: "FeeReceipt" },
    demandId: { type: mongoose.Schema.Types.ObjectId, ref: "FeeDemand" },

    reason: {
      type: String,
      enum: ["advance", "adjustment", "refund", "cancellation"],
      required: true,
    },
    remark: { type: String, trim: true },

    createdby: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

feeCreditLedgerSchema.index({ schId: 1, studentId: 1, session: 1 });

module.exports = mongoose.model("FeeCreditLedger", feeCreditLedgerSchema);