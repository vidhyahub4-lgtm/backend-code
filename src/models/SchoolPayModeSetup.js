const mongoose = require('mongoose');
const { Schema } = mongoose;

const installmentSchema = new Schema(
  {
    id: {
      type: Number,
      required: true
    },
    installment: {
      type: String, // e.g. "january", "february"
      required: true,
      trim: true
    }
  },
  { _id: true }
);

const feeStructureSchema = new Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId, // e.g. "1", "2", "10",
      ref:'Class',
      required: true,
      trim: true
    },
    duration: {
      type: String, // e.g. "1-year"
      required: true,
      trim: true
    },
    payModeDuration: {
      type: String, // e.g. "1-month"
      required: true,
      trim: true
    },
    installment: [installmentSchema]
  },
  { _id: true }
);

const schoolPayModeSetupSchema = new Schema(
  {
    schId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true
    },
    schCode: {
      type: String,
      required: true,
      trim: true
    },
    session: {
      type: String, // e.g. "25-2026"
      required: true,
      trim: true
    },
    feeStructure: [feeStructureSchema],
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
        
    }
  },
  { timestamps: true }
);

// Prevent duplicate pay mode setups for the same school + session
schoolPayModeSetupSchema.index({ schId: 1, session: 1 }, { unique: true });

const SchoolPayModeSetup = mongoose.model(
  'SchoolPayModeSetup',
  schoolPayModeSetupSchema
);

module.exports = SchoolPayModeSetup;