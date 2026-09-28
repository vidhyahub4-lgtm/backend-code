const SchClass = require("../models/school-setting/schoolClass");
const SchHouse = require("../models/school-setting/schhouse");
const FeePlanSetup = require("../models/school-setting/feeplansetup");
const NewStudentRegistration = require("../models/school-setting/newRegistration");
const AppError = require("../utils/appError");
const feetype = require("../models/school-setting/feeplan");
const feeheadtype = require("../models/school-setting/feeheadSetup");
const mongoose = require("mongoose");
const RegistrationCounter = require("../models/school-setting/registrationCounterSchema");
const DevSuperSession = require("../models/dev_super/session");
const feeService = require("./feeService");
const StudentAdmission = require("../models/school-setting/Studentadmission");
const StudentEnrollment = require("../models/school-setting/Studentenrollment");

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

// move this out of createFeePlanSetup so both functions share it
const populateFeePlan = async (feePlanId) => {
  const populated = await FeePlanSetup.findById(feePlanId)
    .populate("session")
    .populate("classes.classID")
    .lean();
  if (!populated) throw new AppError("Fee plan not found", 404);
  return populated;
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

    // ---------- 1. All classes of the school ----------
    const schoolClasses = await SchClass.find({ schoolID: schId })
      .populate("classID")
      .populate("sectionID")
      .lean();

    if (!schoolClasses.length) {
      throw new AppError("No classes found for this school", 404);
    }

    const classMap = new Map();
    schoolClasses.forEach((schClass) => {
      if (!schClass.classID) return;
      const classId = schClass.classID._id.toString();
      if (!classMap.has(classId)) {
        classMap.set(classId, {
          classID: schClass.classID._id,
          schClasses: [],
        });
      }
      classMap.get(classId).schClasses.push(schClass);
    });

    // ---------- 2. Fee heads configured for this school/session/headtype ----------
    const sessionDoc = await DevSuperSession.findById(session).lean();
    const sessionName = sessionDoc?.session ?? session;

    const feeHeadSetup = await feeheadtype
      .findOne({
        headtype: headType,
        session: sessionName,
        schId,
      })
      .lean();

    if (!feeHeadSetup?.feehead?.length) {
      throw new AppError(
        `No fee heads configured for ${headType} (${sessionName})`,
        404,
      );
    }

    const feeHeads = [
      ...new Set(feeHeadSetup.feehead.map((h) => h.trim()).filter(Boolean)),
    ];

    // ---------- 3. Amounts supplied by frontend ----------
    // expected: classes = [{ classID, heads: [{ feetype, amount }] }]
    const providedAmounts = new Map(); // classId -> Map(feetype -> amount)
    if (Array.isArray(classes)) {
      classes.forEach((item) => {
        if (!item.classID) return;
        const headMap = new Map();
        (item.heads || []).forEach((h) => {
          if (h?.feetype) headMap.set(h.feetype.trim(), Number(h.amount) || 0);
        });
        providedAmounts.set(item.classID.toString(), headMap);
      });
    }

    const getAmount = (classId, feetype) =>
      providedAmounts.get(classId)?.get(feetype) ?? 0;

    const sumHeads = (heads) =>
      heads.reduce((sum, h) => sum + (Number(h.amount) || 0), 0);

    // ---------- 4. Populate helper ----------
    const populateFeePlan = async (feePlanId) => {
      const populated = await FeePlanSetup.findById(feePlanId)
        .populate("session")
        .populate("classes.classID")
        .lean();
      if (!populated) throw new AppError("Fee plan not found", 404);
      return populated;
    };

    // ---------- 5. Existing plan: sync missing classes / heads ----------
    const existingFeePlan = await FeePlanSetup.findOne({
      headType,
      session,
      schId,
    });

    if (existingFeePlan) {
      let changed = false;

      const planClassMap = new Map(
        existingFeePlan.classes.map((c) => [c.classID.toString(), c]),
      );

      for (const [classId, item] of classMap) {
        const planClass = planClassMap.get(classId);

        // (a) class added to the school after the plan was created
        if (!planClass) {
          const heads = feeHeads.map((feetype) => ({
            feetype,
            amount: getAmount(classId, feetype),
          }));
          existingFeePlan.classes.push({
            classID: item.classID,
            heads,
            total: sumHeads(heads),
          });
          changed = true;
          continue;
        }

        // (b) fee head added later to feeheadtype (e.g. "smart erp")
        const haveHeads = new Set(planClass.heads.map((h) => h.feetype));
        feeHeads.forEach((feetype) => {
          if (!haveHeads.has(feetype)) {
            planClass.heads.push({
              feetype,
              amount: getAmount(classId, feetype),
            });
            changed = true;
          }
        });
      }

      if (changed) {
        existingFeePlan.classes.forEach((c) => {
          c.total = sumHeads(c.heads);
        });
        await existingFeePlan.save();
      }

      return await populateFeePlan(existingFeePlan._id);
    }

    // ---------- 6. New plan: every class x every fee head ----------
    const feePlanClasses = Array.from(classMap.values()).map((item) => {
      const classId = item.classID.toString();
      const heads = feeHeads.map((feetype) => ({
        feetype,
        amount: getAmount(classId, feetype),
      }));
      return { classID: item.classID, heads, total: sumHeads(heads) };
    });

    const feePlan = await FeePlanSetup.create({
      headType,
      session,
      classes: feePlanClasses,
      schId,
      createdby: userId,
    });

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

  updateFeePlanSetup: async ({ planId, headType, schId, classes }) => {
    if (!Array.isArray(classes) || !classes.length) {
      throw new AppError("classes array is required", 400);
    }

    const feePlan = await FeePlanSetup.findOne({
      _id: planId,
      schId,
      headType,
    });
    if (!feePlan) {
      throw new AppError(`Fee plan not found for head type "${headType}"`, 404);
    }

    for (const item of classes) {
      const planClass = feePlan.classes.find(
        (c) => c.classID.toString() === String(item.classID),
      );
      if (!planClass) {
        throw new AppError(
          `Class ${item.classID} is not part of this fee plan`,
          404,
        );
      }

      for (const h of item.heads || []) {
        const feetype = h.feetype?.trim();
        const amount = Number(h.amount);

        if (!feetype || !Number.isFinite(amount) || amount < 0) {
          throw new AppError(`Invalid amount for fee head "${h.feetype}"`, 400);
        }

        const planHead = planClass.heads.find((x) => x.feetype === feetype);
        if (!planHead) {
          throw new AppError(
            `Fee head "${feetype}" not found in this plan`,
            404,
          );
        }

        planHead.amount = amount;
      }

      planClass.total = planClass.heads.reduce((sum, h) => sum + h.amount, 0);
    }

    await feePlan.save();
    return await populateFeePlan(feePlan._id);
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
              classApplyfor: {
                classID: classApplyfor.classID,
                sectionID: classApplyfor.sectionID,
              },
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

  getAlNewRegbyid: async ({ regno, schId }) => {
    const newStudentReg = await NewStudentRegistration.findOne({
      schId,
      regno,
    }).populate({
      path: "classApplyfor.classID",
      select: "className classInWord",
    })
    .populate({
      path: "classApplyfor.sectionID",
      select: "sectionName",
    });

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

  /*
   * Admit a student:
   *   1. StudentAdmission   (permanent record)
   *   2. StudentEnrollment  (class / section / roll for this session)
   *   3. FeeDemand rows     (admission fee heads from the fee plan)
   * All three succeed together or none are saved.
   */
  admitStudent: async ({
    schId,
    userId,
    regno,
    admno,
    session,
    classID,
    sectionId,
    rollNo,
    admissionDate,
  }) => {
    // the class + section must exist for THIS school
    const validClass = await SchClass.exists({
      schoolID: schId,
      classID,
      sectionID: sectionId,
    });
    if (!validClass) {
      throw new AppError("Class / section not found for this school", 404);
    }

    const registration = await NewStudentRegistration.findOne({
      schId,
      session,
      _id: regno,
    });

    if (!registration) {
      throw new AppError(`Registration with regno ${regno} not found`, 404);
    }

    // if (registration.status === "admitted") {
    //   throw new AppError(
    //     `Registration with regno ${registration?.regno} is already admitted`,
    //     409,
    //   );
    // }
    if (registration.status === "admitted") {
      const admission = await StudentAdmission.findOne({
        regno,
      });

      if (admission?.pystatus === "pending") {
        throw new AppError(
          `Student with registration number ${registration?.regno} has already been admitted, but the admission payment is still pending.`,
          409,
        );
      }

      if (admission?.pystatus === "done") {
        throw new AppError(
          `Student with registration number ${registration?.regno} has already been admitted, and the admission payment has been completed.`,
          408,
        );
      }

      throw new AppError(
        `Student with registration number ${registration?.regno} has already been admitted.`,
        409,
      );
    }

    if (registration.status === "rejected") {
      throw new AppError(
        `Registration with regno ${regno} has been rejected`,
        409,
      );
    }

    const dbSession = await mongoose.startSession();
    let result;

    try {
      await dbSession.withTransaction(async () => {
        const [student] = await StudentAdmission.create(
          [
            {
              schId,
              admno,
              regno,
              admissionSession: session,
              admissionDate: admissionDate || new Date(),
              createdby: userId,
            },
          ],
          { session: dbSession },
        );

        const [enrollment] = await StudentEnrollment.create(
          [
            {
              schId,
              session,
              studentId: student._id,
              classID,
              sectionId,
              rollNo,
              createdby: userId,
            },
          ],
          { session: dbSession },
        );

        const demandsCreated = await feeService.generateAdmissionDemands({
          schId,
          session,
          studentId: student._id,
          classID,
          userId,
          dbSession,
        });

        const updatedRegistration =
          await NewStudentRegistration.findOneAndUpdate(
            {
              _id: registration._id,
              status: "pending",
            },
            {
              $set: {
                status: "admitted",
                admdate: admissionDate || new Date(),
              },
            },
            {
              new: true,
              session: dbSession,
            },
          );

        if (!updatedRegistration) {
          throw new AppError("Registration status could not be updated", 409);
        }

        result = { student, enrollment, demandsCreated };
      });
    } catch (err) {
      if (err.code === 11000) {
        throw new AppError(
          "Admission no, registration or roll no already exists",
          409,
        );
      }
      throw err;
    } finally {
      await dbSession.endSession();
    }

    return result;
  },

  /*
   * Class-wise student list for a session.
   */
  listEnrollments: async ({ schId, session, classID, sectionId }) => {
    return await StudentEnrollment.find({
      schId,
      session,
      ...(classID ? { classID } : {}),
      ...(sectionId ? { sectionId } : {}),
    })
      .populate({ path: "studentId", populate: { path: "regno" } })
      .populate("classID")
      .populate("sectionId")
      .sort({ rollNo: 1 })
      .lean();
  },
};

module.exports = schoolSettingService;
