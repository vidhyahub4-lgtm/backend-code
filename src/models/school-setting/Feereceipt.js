// const mongoose = require("mongoose");

// /*
//  * One payment transaction. A single receipt can pay several fee heads
//  * and several months at once (each line points at a FeeDemand).
//  * Receipts are never deleted, only cancelled.
//  */
// const receiptLineSchema = new mongoose.Schema(
//   {
//     demandId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "FeeDemand",
//       required: true,
//     },
//     headType: { type: String, required: true },
//     feetype: { type: String, required: true, trim: true },
//     installmentMonthId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "InstallmentMonth",
//       default: null,
//     },
//     amount: { type: Number, required: true, min: 0 },
//   },
//   { _id: false },
// );

// const feeReceiptSchema = new mongoose.Schema(
//   {
//     schId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "School",
//       required: true,
//     },

//     session: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "DevSuperSession",
//       required: true,
//     },

//     studentId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "StudentAdmission",
//       required: true,
//     },

//     // sequential per school + session (see Counter model)
//     receiptNo: { type: Number, required: true },

//     paymentDate: { type: Date, default: Date.now },

//     mode: {
//       type: String,
//       enum: ["cash", "upi", "cheque", "online", "card"],
//       required: true,
//     },
//     refNo: { type: String, trim: true }, // cheque no / UTR / txn id

//     lines: {
//       type: [receiptLineSchema],
//       validate: [(v) => v.length > 0, "Receipt needs at least one line"],
//     },

//     // sum of lines
//     totalAmount: { type: Number, min: 0 },

//     // money taken beyond what was due, goes to FeeCreditLedger
//     advanceAmount: { type: Number, default: 0, min: 0 },

//     status: {
//       type: String,
//       enum: ["active", "cancelled", 'inactive'],
//       default: "active",
//     },
//     cancelledAt: Date,
//     cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//     cancelReason: { type: String, trim: true },

//     createdby: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//   },
//   { timestamps: true },
// );

// feeReceiptSchema.pre("validate", function () {
//   this.totalAmount = this.lines.reduce((sum, l) => sum + l.amount, 0);

// });

// feeReceiptSchema.index({ schId: 1, session: 1, receiptNo: 1 }, { unique: true });
// feeReceiptSchema.index({ schId: 1, paymentDate: 1 }); // daily collection
// feeReceiptSchema.index({ schId: 1, session: 1, studentId: 1 });

// module.exports = mongoose.model("FeeReceipt", feeReceiptSchema);




const mongoose = require("mongoose");

/*
 * One payment transaction. Captures the full breakdown shown at the
 * counter: previous due, installment total, late fine, misc, total
 * concession, payable amount, what was actually paid, and whatever's
 * left as current due or current advance after this receipt.
 *
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
    // _id of the embedded installment sub-document in SchoolPayModeSetup
    installmentMonthId: { type: mongoose.Schema.Types.ObjectId, default: null },

    planAmount: { type: Number, required: true, min: 0 }, // gross, before this line's concession
    concession: { type: Number, default: 0, min: 0 },      // concession given on THIS demand, THIS receipt
    amount: { type: Number, required: true, min: 0 },      // applied toward the demand (after concession)
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
    rptnm: { type: String, trim: true }, // display label, e.g. "Receipt #20"

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

    // ---- the breakdown shown on the counter screen ----
    pdue: { type: Number, default: 0, min: 0 },        // due carried in from before this receipt
    instotamt: { type: Number, default: 0, min: 0 },   // sum of GROSS line planAmounts in this receipt
    lfine: { type: Number, default: 0, min: 0 },
    misc: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, default: 0, min: 0 }, // instotamt + lfine + misc + pdue
    cons: { type: Number, default: 0, min: 0 },         // total concession across all lines, this receipt
    payableamt: { type: Number, default: 0, min: 0 },   // totalAmount - cons - advance already held
    paidamt: { type: Number, default: 0, min: 0 },      // portion of payableamt actually cleared
    cdue: { type: Number, default: 0, min: 0 },         // still owed after this receipt
    cAdv: { type: Number, default: 0, min: 0 },         // left over as advance after this receipt

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

feeReceiptSchema.index({ schId: 1, session: 1, receiptNo: 1 }, { unique: true });
feeReceiptSchema.index({ schId: 1, paymentDate: 1 }); // daily collection
feeReceiptSchema.index({ schId: 1, session: 1, studentId: 1 });

module.exports = mongoose.model("FeeReceipt", feeReceiptSchema);