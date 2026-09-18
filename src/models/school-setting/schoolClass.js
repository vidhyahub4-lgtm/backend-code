const mongoose = require("mongoose");
const { Schema } = mongoose;

const SchClass = new Schema(
  {
    classID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    sectionID: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
        required: true,
      },
    ],

    schCode: {
      type: String,
      required: true,
      trim: true,
    },

    schoolID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
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

module.exports = mongoose.model("SchClass", SchClass);