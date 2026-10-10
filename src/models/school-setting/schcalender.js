const mongoose = require("mongoose");
const { Schema } = mongoose;
const { MONTH_NAMES } = require("../../utils/Monthutil");

/**
 * Calendar
 * ONE document per school + session + class + section.
 *
 * cal = [
 *   { month: "April", id: 731452, dates: [ { date, markas: "H", res: "Holi" }, ... ] },
 *   { month: "May",   id: ...,    dates: [ ... ] },
 *   ... all 12 months of the session (April -> March)
 * ]
 *
 * month.id  = 3 random digits + month number (1-12) + 2 random digits (generated in backend)
 * markas:   H = Holiday (res required) | S = Sunday / weekly off | W = Working day (override)
 */
const dateEntrySchema = new Schema(
  {
    date: { type: Date, required: true }, // stored at 00:00 UTC
    markas: { type: String, enum: ["H", "S", "W"], required: true },
    res: {
      type: String,
      trim: true,
      required: function () {
        return this.markas === "H";
      },
    },
  },
  { _id: false }
);

const monthSchema = new Schema(
  {
    month: { type: String, enum: MONTH_NAMES, required: true },
    id: { type: Number, required: true },
    dates: { type: [dateEntrySchema], default: [] },
  },
  { _id: false }
);

const calendarSchema = new Schema(
  {
    schId: { type: Schema.Types.ObjectId, required: true, index: true },
    session: { type: String, required: true }, // '2026-27'
    clsid: { type: Schema.Types.ObjectId, required: true },
    secid: { type: Schema.Types.ObjectId, required: true },
    cal: { type: [monthSchema], default: [] },
    updatedby: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// a single doc per school + session + class + section
calendarSchema.index({ schId: 1, session: 1, clsid: 1, secid: 1 }, { unique: true });

module.exports = mongoose.model("Calendar", calendarSchema);