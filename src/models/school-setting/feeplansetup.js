const mongoose = require("mongoose");

const feePlanSetupSchema = new mongoose.Schema(
  {
    headType: {
      type: String,
      enum: ["admission", "promotion", "monthly", "Misc", "special ocassion"],
      required: true,
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DevSuperSession",
      required: true,
    },

    classes: [
      {
        classID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Class",
          required: true,
        },

        amount: {
          type: Number,
          required: true,
          min: 0,
          default:0
        },
      },
    ],

    schId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    createdby: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const FeePlanSetup = mongoose.model("FeePlanSetup", feePlanSetupSchema);

module.exports = FeePlanSetup;
