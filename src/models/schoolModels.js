const mongoose = require("mongoose");

const schoolSchema = new mongoose.Schema(
  {
    schName: {
      type: String,
      required: true,
      trim: true,
    },

    schAdd: {
      type: String,
      required: true,
      trim: true,
    },

    schInfo: {
      type: String,
      trim: true,
    },

    // cityId: {
    //   type: String,
    //   required: true,
    //   trim: true,
    // },
    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: true,
    },

    stateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "State",
      required: true,
    },

    schoolCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    websiteUrl: {
      type: String,
      trim: true,
    },

    contact1: {
      type: String,
      required: true,
      trim: true,
    },

    contact2: {
      type: String,
      trim: true,
    },

    schemail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    selectBoard: {
      type: mongoose.Schema.Types.ObjectId,
      ref:"Board",
      trim: true,
      required: true,
    },

    instituteType: {
      type: String,
      required: true,
      trim: true,
    },

    schLogo: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      reqired:true
    },
  },
  {
    timestamps: true,
  },
);

const School = mongoose.model("School", schoolSchema);

module.exports = School;
