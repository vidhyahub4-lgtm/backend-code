const mongoose = require("mongoose");

const feeplan = new mongoose.Schema({
    plan:{
        type:String,
        required:true
    },
    createdby :{
        type:String,
        required:true
    }
},{
    timestamps:true
})


module.exports = mongoose.model("feetype", feeplan)