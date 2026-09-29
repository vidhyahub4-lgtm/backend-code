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

    subjects: [
      {
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

        _id: false,
      },
    ],

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

module.exports = mongoose.model("Subject", subjectSchema);