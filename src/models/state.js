const mongoose = require("mongoose");

const stateSchema = new mongoose.Schema(
  {
    stateName: {
      type: String,
      required: true,
      unique: true,
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

const State = mongoose.model("State", stateSchema);

module.exports = State;
