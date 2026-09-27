const mongoose = require("mongoose");
const { Schema } = mongoose;

const teacherSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

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

    // Classes / Sections / Subjects assigned to teacher
    assignedClasses: [
      {
        classID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Class",
    
        },

        sectionID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Section",
        
        },

        subjects: [
          {
            subId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Subject",
              
            },

            subCode: {
              type: String,
             
              trim: true,
              uppercase: true,
            },

            subName: {
              type: String,
             
              trim: true,
            },

            _id: false,
          },
        ],

        _id: false,
      },
    ],

    // Teacher is class teacher of one class-section
    classTeacherOf: {
      classID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
      },

      sectionID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
      },
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    createdby: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

teacherSchema.index(
  { email: 1, schId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Teacher", teacherSchema);