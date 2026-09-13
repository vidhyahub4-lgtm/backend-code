const mongoose = require('mongoose');

const sessionSchema = mongoose.Schema({
  session: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
},{
    timestamps: true,
});


module.exports = mongoose.model('Session', sessionSchema)