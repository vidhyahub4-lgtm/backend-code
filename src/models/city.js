const mongoose = require("mongoose");

const citySchema = new mongoose.Schema(
  {
    cityName: {
      type: String,
      required: true,
      trim: true,
    },
    pinCode:{
        type:Number,
        required:true,
        unique:true

    },

    stateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "State",
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

const City = mongoose.model("City", citySchema);

module.exports = City;
