const mongoose = require('mongoose')

const registrationCounterSchema = new mongoose.Schema(
  {
    schId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DevSuperSession",
      required: true,
    },

    seq: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

registrationCounterSchema.index(
  {
    schId: 1,
    session: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "RegistrationCounter",
  registrationCounterSchema
);