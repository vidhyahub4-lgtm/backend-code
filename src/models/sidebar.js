const mongoose = require("mongoose");

const sidebarSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true
    },

    permission: {
      type: [Number],
      default: []
    },

    link: {
      type: String,
      required: true
    },

    icon: {
      type: String,
      default: ""
    },

    children: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },

    order: {
      type: Number,
      default: 0
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Sidebar", sidebarSchema);