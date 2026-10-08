const mongoose = require("mongoose");

const userModel = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
      trim: true,
    },

    lastname: {
      type: String,
      required: true,
      trim: true,
    },

    loginUserName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    phoneno: {
      type: Number,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    userType: {
      type: String,
      enum: ["superAdmin", "admin"],
      required: true,
    },

    image: {
      type: String,
      default: "",
    },
    schid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      default: null,
    },
    refreshToken:{type: String}
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userModel);