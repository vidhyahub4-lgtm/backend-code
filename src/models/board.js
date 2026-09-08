const mongoose = require("mongoose");

const boardSchema = new mongoose.Schema(
  {
    boardName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    startMonth: {
      type: String,
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

const Board = mongoose.model("Board", boardSchema);

module.exports = Board;
