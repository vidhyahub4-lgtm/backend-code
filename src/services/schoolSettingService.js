const SchClass = require("../models/school-setting/schoolClass");
const SchHouse = require("../models/school-setting/schhouse");
const FeePlanSetup = require("../models/school-setting/feeplansetup");
const NewStudentRegistration = require("../models/school-setting/newRegistration");
const AppError = require("../utils/appError");
const feetype = require("../models/school-setting/feeplan");
const feeheadtype = require("../models/school-setting/feeheadSetup");
const mongoose = require("mongoose");
const RegistrationCounter = require("../models/school-setting/registrationCounterSchema");

const getNextRegistrationNumber = async (schId, session, mongoSession) => {
  try {
    const counter = await RegistrationCounter.findOneAndUpdate(
      {
        schId,
        session,
      },
      {
        $inc: {
          seq: 1,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        session: mongoSession,
      },
    );

    return counter.seq;
  } catch (error) {
    if (error.code === 11000) {
      const counter = await RegistrationCounter.findOneAndUpdate(
        {
          schId,
          session,
        },
        {
          $inc: {
            seq: 1,
          },
        },
        {
          new: true,
          session: mongoSession,
        },
      );

      return counter.seq;
    }

    throw error;
  }
};

const schoolSettingService = {
  createSchClass: async ({ schoolID, schCode, sectionID, classID, userId }) => {
    // Check if this class already exists
    // for this particular school
    const existingSchClass = await SchClass.findOne({
      schoolID,
      schCode,
      classID,
    });

    // If class already exists
    if (existingSchClass) {
      // Check if section is already added
      const sectionExists = existingSchClass.sectionID.some(
        (id) => id.toString() === sectionID.toString(),
      );

      // Add new section
      if (!sectionExists) {
        existingSchClass.sectionID.push(sectionID);

        await existingSchClass.save();
      }

      // Return existing/updated document
      return await SchClass.findById(existingSchClass._id)
        .populate("classID")
        .populate("sectionID")
        .populate("schoolID")
        .populate("createdBy");
    }

    // Class doesn't exist
    // Create a new document
    const newSchClass = await SchClass.create({
      schoolID,
      schCode,
      classID,
      sectionID: [sectionID],
      createdBy: userId,
    });

    // Return populated document
    return await SchClass.findById(newSchClass._id)
      .populate("classID")
      .populate("sectionID")
      .populate("schoolID")
      .populate("createdBy");
  },

  getSchClass: async ({ schoolID }) => {
    const filter = schoolID ? { schoolID } : {};

    return await SchClass.find(filter)
      .populate("classID", "className classInWord")
      .populate("sectionID", "sectionName Maxlimit")
      .populate("schoolID", "schName schoolCode")
      .sort({ createdAt: -1 });
  },

  // createSchHouse: async ({ house, schId, userId }) => {
  //   const schHouse = new SchHouse({
  //     house,
  //     schId,
  //     createdby: userId,
  //   });

  //   return await schHouse.save();
  // },
  createSchHouse: async ({ house, schId, userId }) => {
    const houses = Array.isArray(house) ? house : [house];

    const cleanedHouses = houses.map((item) => item.trim()).filter(Boolean);

    if (!cleanedHouses.length) {
      throw new Error("At least one house is required");
    }

    const schHouse = await SchHouse.findOneAndUpdate(
      { schId },

      {
        $addToSet: {
          house: {
            $each: cleanedHouses,
          },
        },

        $setOnInsert: {
          createdby: userId,
        },
      },

      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    return schHouse;
  },

  getSchHouse: async () => {
    return await SchHouse.find().sort({ createdAt: -1 });
  },
  // createFeePlanSetup: async (data) => {
  //   const { headType, session, classes, schId, userId } = data;

  //   const existingFeePlan = await FeePlanSetup.findOne({
  //     headType,
  //     session,
  //     schId,
  //   });

  //   if (existingFeePlan) {
  //     return existingFeePlan;
  //   }

  //   const feePlan = await FeePlanSetup.create({
  //     headType,
  //     session,
  //     classes,
  //     schId,
  //     createdby: userId,
  //   });

  //   return feePlan;
  // },
  createFeePlanSetup: async (data) => {
    const { headType, session, classes, schId, userId } = data;

    // Get all SchClass records for this school
    const schoolClasses = await SchClass.find({
      schoolID: schId,
    })
      .populate("classID")
      .populate("sectionID")
      .lean();

    if (!schoolClasses.length) {
      throw new AppError("No classes found for this school", 404);
    }

    // Group SchClass by actual Class ID
    const classMap = new Map();

    schoolClasses.forEach((schClass) => {
      const classId = schClass.classID._id.toString();

      if (!classMap.has(classId)) {
        classMap.set(classId, {
          classID: schClass.classID._id,
          schClasses: [],
        });
      }

      classMap.get(classId).schClasses.push(schClass);
    });

    /*
     * Helper function
     * Used for BOTH existing and newly created fee plans
     */
    const populateFeePlan = async (feePlanId) => {
      const populatedFeePlan = await FeePlanSetup.findById(feePlanId)
        .populate("session")
        // .populate("schId")
        .populate("classes.classID")
        .lean();

      if (!populatedFeePlan) {
        throw new AppError("Fee plan not found", 404);
      }

      populatedFeePlan.classes = populatedFeePlan.classes.map((feeClass) => {
        const classId = feeClass.classID._id.toString();

        const classInfo = classMap.get(classId);

        return {
          ...feeClass,

          // Add this if you want SchClass data
          // schClasses: classInfo
          //   ? classInfo.schClasses
          //   : [],
        };
      });

      return populatedFeePlan;
    };

    /*
     * Check existing fee plan
     */
    const existingFeePlan = await FeePlanSetup.findOne({
      headType,
      session,
      schId,
    });

    /*
     * If already exists,
     * return it with SAME population
     */
    if (existingFeePlan) {
      return await populateFeePlan(existingFeePlan._id);
    }

    /*
     * Frontend supplied amounts
     */
    const providedClasses = new Map();

    if (Array.isArray(classes)) {
      classes.forEach((item) => {
        if (item.classID) {
          providedClasses.set(
            item.classID.toString(),
            Number(item.amount || 0),
          );
        }
      });
    }

    /*
     * Create ONE fee-plan entry per actual Class
     */
    const feePlanClasses = Array.from(classMap.values()).map((item) => {
      const classId = item.classID.toString();

      return {
        classID: item.classID,

        amount: providedClasses.has(classId) ? providedClasses.get(classId) : 0,
      };
    });

    /*
     * Create Fee Plan
     */
    const feePlan = await FeePlanSetup.create({
      headType,
      session,
      classes: feePlanClasses,
      schId,
      createdby: userId,
    });

    /*
     * Return newly created plan
     * with SAME population
     */
    return await populateFeePlan(feePlan._id);
  },

  getAllFeePlanSetups: async (schId) => {
    const filter = {};

    if (schId) {
      filter.schId = schId;
    }

    const feePlans = await FeePlanSetup.find(filter)
      .populate({
        path: "session",
        select: "session",
      })
      .populate({
        path: "classes.classID",
        select: "className classInWord",
      })
      .populate({
        path: "schId",
        select: "schName schoolCode",
      })
      .sort({ createdAt: -1 });

    return feePlans;
  },

  // createNewRegistration: async (userId, data) => {
  //   const {
  //     regno,
  //     session,
  //     schId,
  //     schCode,
  //     sname,
  //     fname,
  //     mname,
  //     gname,
  //     gender,
  //     category,
  //     age,
  //     mothertongue,
  //     secLang,
  //     nationality,
  //     religion,
  //     adharId,
  //     pen,
  //     mob1,
  //     mob2,
  //     email,
  //     whatAppno,
  //     lclass,
  //     lper,
  //     lsch,
  //     lboard,
  //     classApplyfor,
  //     registrationdate,
  //     Image,
  //   } = data;

  //   // Check duplicate registration number for same school/session
  //   const existingRegistration = await NewStudentRegistration.findOne({
  //     regno,
  //     session,
  //     schId,
  //   });

  //   if (existingRegistration) {
  //     throw new Error(
  //       "Registration number already exists for this school and session",
  //     );
  //   }

  //   const newRegistration = await NewStudentRegistration.create({
  //     regno,
  //     session,
  //     schId,
  //     schCode,
  //     sname,
  //     fname,
  //     mname,
  //     gname,
  //     gender,
  //     category,
  //     age,
  //     mothertongue,
  //     secLang,
  //     nationality,
  //     religion,
  //     adharId,
  //     pen,
  //     mob1,
  //     mob2,
  //     email,
  //     whatAppno,
  //     lclass,
  //     lper,
  //     lsch,
  //     lboard,
  //     classApplyfor,
  //     registrationdate,
  //     Image,
  //     createdby: userId,
  //   });

  //   return newRegistration;
  // },

  createNewRegistration: async (userId, data) => {
    const {
      session,
      schId,
      schCode,
      sname,
      fname,
      mname,
      gname,
      gender,
      category,
      age,
      mothertongue,
      secLang,
      nationality,
      religion,
      adharId,
      penno,
      mob1,
      mob2,
      email,
      whatAppno,
      lclass,
      lper,
      lsch,
      lboard,
      classApplyfor,
      registrationdate,
      Image,
      dob,
    } = data;

    // Start MongoDB session
    const mongoSession = await mongoose.startSession();

    try {
      let newRegistration;

      // Start transaction
      await mongoSession.withTransaction(async () => {
        // Generate next registration number
        const regno = await getNextRegistrationNumber(
          schId,
          session,
          mongoSession,
        );

        // Create student registration
        const registrations = await NewStudentRegistration.create(
          [
            {
              regno,
              session,
              schId,
              schCode,
              sname,
              fname,
              mname,
              gname,
              gender,
              category,
              age,
              mothertongue,
              secLang,
              nationality,
              religion,
              adharId,
              penno,
              mob1,
              mob2,
              email,
              whatAppno,
              lclass,
              lper,
              lsch,
              lboard,
              classApplyfor,
              registrationdate,
              Image,
              createdby: userId,
              dob,
            },
          ],
          {
            session: mongoSession,
          },
        );

        newRegistration = registrations[0];
      });

      return newRegistration;
    } catch (error) {
      throw error;
    } finally {
      await mongoSession.endSession();
    }
  },

  getAlNewReg: async (schId) => {
    const newStudentReg = await NewStudentRegistration.find({ schId });
    return newStudentReg;
  },

  createfeeheadSetup: async ({ headtype, session, feehead, userId, schId }) => {
    // Find existing setup for same
    // headtype + session + school
    const existfeeheadsetup = await feeheadtype.findOne({
      headtype,
      session,
      schId,
    });

    // If document already exists
    if (existfeeheadsetup) {
      // Check if this feehead is already present
      if (!existfeeheadsetup.feehead.includes(feehead)) {
        // Add new feehead to existing array
        existfeeheadsetup.feehead.push(feehead);

        await existfeeheadsetup.save();
      }

      // Return existing document
      return existfeeheadsetup;
    }

    // If no document exists, create new one
    const feeheads = new feeheadtype({
      headtype,
      session,
      feehead: [feehead],
      createdby: userId,
      schId,
    });

    return await feeheads.save();
  },

  createfeeplantype: async ({ plan, userId, schId }) => {
    // Find existing fee plan for this school
    const existingFeePlan = await feetype.findOne({
      schId,
    });

    // If school already has a fee plan document
    if (existingFeePlan) {
      // Add only if plan does not already exist
      if (!existingFeePlan.plan.includes(plan)) {
        existingFeePlan.plan.push(plan);

        await existingFeePlan.save();
      }

      return existingFeePlan;
    }

    // Create new document if school doesn't have one
    const newFeePlan = new feetype({
      plan: [plan],
      createdby: userId,
      schId,
    });

    return await newFeePlan.save();
  },

  getFeeHeadSetup: async ({ schId }) => {
    return await feeheadtype.find({ schId }).sort({ createdAt: -1 });
  },

  getFeePlanType: async ({ schId }) => {
    return await feetype.find({ schId }).sort({ createdAt: -1 });
  },
};

module.exports = schoolSettingService;
