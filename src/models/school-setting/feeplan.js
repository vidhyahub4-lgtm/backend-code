const mongoose = require("mongoose");

const feeplan = new mongoose.Schema(
  {
    plan: {
      type: [String],
      required: true,
    },

    createdby: {
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
  }
);

module.exports = mongoose.model("feetype", feeplan);