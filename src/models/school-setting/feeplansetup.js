// 

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

        // one entry per fee head, e.g. "admission", "smart erp"
        heads: [
          {
            feetype: { type: String, required: true, trim: true },
            amount: { type: Number, required: true, min: 0, default: 0 },
          },
        ],

        // the "Total" row in the grid
        total: { type: Number, min: 0, default: 0 },
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
  { timestamps: true },
);

// one plan per school + session + head type
feePlanSetupSchema.index({ headType: 1, session: 1, schId: 1 }, { unique: true });

module.exports = mongoose.model("FeePlanSetup", feePlanSetupSchema);