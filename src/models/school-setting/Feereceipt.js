const mongoose = require("mongoose");

/*
 * One payment transaction. A single receipt can pay several fee heads
 * and several months at once (each line points at a FeeDemand).
 * Receipts are never deleted, only cancelled.
 */
const receiptLineSchema = new mongoose.Schema(
  {
    demandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeDemand",
      required: true,
    },
    headType: { type: String, required: true },
    feetype: { type: String, required: true, trim: true },
    installmentMonthId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InstallmentMonth",
      default: null,
    },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const feeReceiptSchema = new mongoose.Schema(
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

    // sequential per school + session (see Counter model)
    receiptNo: { type: Number, required: true },

    paymentDate: { type: Date, default: Date.now },

    mode: {
      type: String,
      enum: ["cash", "upi", "cheque", "online", "card"],
      required: true,
    },
    refNo: { type: String, trim: true }, // cheque no / UTR / txn id

    lines: {
      type: [receiptLineSchema],
      validate: [(v) => v.length > 0, "Receipt needs at least one line"],
    },

    // sum of lines
    totalAmount: { type: Number, min: 0 },

    // money taken beyond what was due, goes to FeeCreditLedger
    advanceAmount: { type: Number, default: 0, min: 0 },

    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
    },
    cancelledAt: Date,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancelReason: { type: String, trim: true },

    createdby: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

feeReceiptSchema.pre("validate", function (next) {
  this.totalAmount = this.lines.reduce((sum, l) => sum + l.amount, 0);
  next();
});

feeReceiptSchema.index({ schId: 1, session: 1, receiptNo: 1 }, { unique: true });
feeReceiptSchema.index({ schId: 1, paymentDate: 1 }); // daily collection
feeReceiptSchema.index({ schId: 1, session: 1, studentId: 1 });

module.exports = mongoose.model("FeeReceipt", feeReceiptSchema);