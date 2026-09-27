const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    schId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    schCode: {
      type: String,
      required: true,
      trim: true,
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DevSuperSession",
      required: true,
      index: true,
    },

    subjectName: {
      type: String,
      required: true,
      trim: true,
    },

    subCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    createdby: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Same subject code cannot be duplicated
// for the same school and session
subjectSchema.index(
  {
    schId: 1,
    session: 1,
    subCode: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Subject", subjectSchema);