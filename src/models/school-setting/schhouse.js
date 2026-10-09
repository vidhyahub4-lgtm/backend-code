const mongoose = require("mongoose");

const schHouseSchema = new mongoose.Schema(
  {
    house: [{
      type: String,
      required: true,
      // unique: true,
      trim: true,
    }],
    schId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      unique:true
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

module.exports = mongoose.model("SchHouse", schHouseSchema);
