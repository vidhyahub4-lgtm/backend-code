const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
  {
    sectionName: {
      type: String,
      required: true,
      trim: true,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    Maxlimit:{
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
  },
);

// A section name only needs to be unique *within* its own class —
// "A" can exist for Class 1 and Class 2 at the same time.
sectionSchema.index({ sectionName: 1, classId: 1 }, { unique: true });

const Section = mongoose.model("Section", sectionSchema);

module.exports = Section;
