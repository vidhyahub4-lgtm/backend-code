const mongoose = require("mongoose");

const feeheadsetup = new mongoose.Schema({
  headtype: {
    type: String,
    enum: ["admisssion", "promotion", "monthly", "Misc", "special ocassion"],
    required: true,
  },
  session: {
    type: String,
    required: true,
  },
  feehead:{
    type:[String],
    required:true
  },
  schId: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "School",
       required: true,
     },
  createdby:String
},{
    timestamps:true
});


module.exports = mongoose.model('feeheadtype', feeheadsetup)
