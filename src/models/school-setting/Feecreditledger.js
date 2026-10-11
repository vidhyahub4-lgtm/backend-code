// const mongoose = require("mongoose");

// /*
//  * Student advance / credit as a ledger, not a stored balance.
//  * Balance = sum(credit) - sum(debit) for the student.
//  *
//  * credit: parent paid extra (advance)
//  * debit : advance adjusted against a later demand, or refunded
//  */
// const feeCreditLedgerSchema = new mongoose.Schema(
//   {
//     schId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "School",
//       required: true,
//     },

//     studentId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "StudentAdmission",
//       required: true,
//     },

//     session: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "DevSuperSession",
//       required: true,
//     },

//     type: { type: String, enum: ["credit", "debit"], required: true },
//     amount: { type: Number, required: true, min: 0.01 },

//     receiptId: { type: mongoose.Schema.Types.ObjectId, ref: "FeeReceipt" },
//     demandId: { type: mongoose.Schema.Types.ObjectId, ref: "FeeDemand" },

//     reason: {
//       type: String,
//       enum: ["advance", "adjustment", "refund", "cancellation"],
//       required: true,
//     },
//     remark: { type: String, trim: true },

//     createdby: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//   },
//   { timestamps: true },
// );

// feeCreditLedgerSchema.index({ schId: 1, studentId: 1, session: 1 });

// module.exports = mongoose.model("FeeCreditLedger", feeCreditLedgerSchema);



const mongoose = require("mongoose");

/*
 * ONE document per student (per school) — a running account summary,
 * not an append-only transaction log. Updated every time a receipt
 * is created or cancelled, so it always reflects the latest state.
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

    // most recent session a payment was made in
    session: { type: mongoose.Schema.Types.ObjectId, ref: "DevSuperSession" },

    totamt: { type: Number, default: 0, min: 0 },  // total cash collected, all time
    totcons: { type: Number, default: 0, min: 0 }, // total concession given, all time

    lastrpt: {
      lastrptid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FeeReceipt",
        default: null,
      },
      lastpayamt: { type: Number, default: 0 }, // total cash received in that receipt
      pdue: { type: Number, default: 0 },       // that receipt's pdue
      cdue: { type: Number, default: 0 },       // that receipt's cdue — THIS is next receipt's pdue
      cadv: { type: Number, default: 0 },       // that receipt's cAdv — THIS is next receipt's advance
    },
  },
  { timestamps: true },
);

feeCreditLedgerSchema.index({ schId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("FeeCreditLedger", feeCreditLedgerSchema);