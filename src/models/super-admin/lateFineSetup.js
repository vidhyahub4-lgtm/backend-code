const mongoose = require("mongoose");

const lateFineSetupSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DevSuperSession",
      required: true,
    },

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchClass",
      required: true,
    },

    selectInstallemt: {
      type: Number,
      required: true,
    },

    duedateAfter: {
      type: Date,
      required: true,
    },

    fineType: {
      type: String,
      enum: ["fixed", "dialy"],
      required: true,
    },

    amount: {
      type: String,
      required: true,
    },
    schId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const LateFineSetup = mongoose.model("LateFineSetup", lateFineSetupSchema);

module.exports = LateFineSetup;
