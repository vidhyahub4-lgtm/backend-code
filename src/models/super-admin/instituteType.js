const mongoose = require("mongoose");

const instituteType = new mongoose.Schema(
  {
    instituteType: {
      type: String,
      required: true,
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { 
    timestamps: true,
  }
);

const InstituteType = mongoose.model("InstituteType", instituteType);

module.exports = InstituteType;
