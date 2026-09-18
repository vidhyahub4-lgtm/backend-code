const mongoose = require("mongoose");

const newRegistrationSchema = new mongoose.Schema(
  {
    // Registration Details
    regno: {
      type: Number,
      required: true,
    },

    session: {
      type: String,
      required: true,
      trim: true,
    },

    schId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    schCode: {
      type: String,
      required: true,
      trim: true,
    },

    // Student Name Details
    sname: {
      type: String,
      required: true,
      trim: true,
    },

    fname: {
      type: String,
      required: true,
      trim: true,
    },

    mname: {
      type: String,
      required: true,
      trim: true,
    },

    gname: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },

    category: {
      type: String,
      enum: ["general", "obc", "sc", "st"],
      required: true,
    },

    age: {
      type: Number,
      required: true,
      min: 1,
    },

    // Language & Personal Details
    mothertongue: {
      type: String,
      required: true,
      trim: true,
    },

    secLang: {
      type: String,
      trim: true,
    },

    nationality: {
      type: String,
      required: true,
      trim: true,
      default: "Indian",
    },

    religion: {
      type: String,
      required: true,
      trim: true,
    },

    pen: {
      type: String,
      trim: true,
    },

    mob1: {
      type: String,
      required: true,
      match: [/^[6-9]\d{9}$/, "Please enter a valid mobile number"],
    },

    mob2: {
      type: String,
      match: [/^[6-9]\d{9}$/, "Please enter a valid mobile number"],
    },

    whatAppno: {
      type: String,
      required: true,
      match: [/^[6-9]\d{9}$/, "Please enter a valid WhatsApp number"],
    },

    adharId: {
      type: String,
      match: [/^\d{12}$/, "Aadhaar number must be 12 digits"],
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please enter a valid email address",
      ],
    },

    // Previous School Details
    lclass: {
      type: String,
      trim: true,
    },

    lper: {
      type: Number,
    },

    lsch: {
      type: String,
      trim: true,
    },

    lboard: {
      type: String,
      trim: true,
    },

    // Admission Details
    classApplyfor: {
      type: String,
      trim: true,
    },

    registrationdate: {
      type: Date,
      default: Date.now,
    },

    // Student Image
    Image: {
      type: String,
      default: "",
     
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

module.exports = mongoose.model("NewStudentRegistration", newRegistrationSchema);
