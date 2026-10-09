const FeePlanSetup = require("../models/school-setting/feeplansetup");
const FeeDemand = require("../models/school-setting/feeDemand");
const StudentEnrollment = require("../models/school-setting/Studentenrollment");
const AppError = require("../utils/appError");

/*
 * Turns a FeePlanSetup into FeeDemand rows (what each student owes).
 * Uses upsert + $setOnInsert, so running it twice never creates duplicates
 * and never overwrites a demand that already has payments.
 */


const findPlanClass = (feePlan, classID) =>
  feePlan.classes.find((c) => c.classID.toString() === String(classID));
 
const buildDemandOps = ({
  schId,
  session,
  studentId,
  classID,
  headType,
  feePlan,
  planHeads,
  installmentMonthId = null,
  installmentMonthNo = null,
  userId,
}) =>
  planHeads.map((h) => ({
    updateOne: {
      filter: {
        studentId,
        session,
        headType,
        feetype: h.feetype,
        installmentMonthId,
      },
      update: {
        $setOnInsert: {
          schId,
          classID,
          feePlanId: feePlan._id,
          installmentMonthNo,
          planAmount: h.amount,
          concession: 0,
          netAmount: h.amount, // bulkWrite skips the model hook, so set it here
          paidAmount: 0,
          status: h.amount === 0 ? "paid" : "unpaid",
          createdby: userId,
        },
      },
      upsert: true,
    },
  }));
 


module.exports = {
  /*
   * Admission-time demands (headType "admission") for ONE student.
   * Called from admission.service inside its transaction.
   */
  generateAdmissionDemands: async ({
    schId,
    session,
    studentId,
    classID,
    userId,
    dbSession = null,
  }) => {
    const feePlan = await FeePlanSetup.findOne({
      schId,
      session,
      headType: "admission",
    })
      .session(dbSession)
      .lean();

    if (!feePlan) {
      throw new AppError(
        "Admission fee plan is not set up for this session",
        404,
      );
    }

    const planClass = findPlanClass(feePlan, classID);
    if (!planClass) {
      throw new AppError(
        "This class is missing from the admission fee plan. Open the fee plan once to sync new classes.",
        404,
      );
    }

    const ops = buildDemandOps({
      schId,
      session,
      studentId,
      classID,
      headType: "admission",
      feePlan,
      planHeads: planClass.heads,
      userId,
    });

    if (!ops.length) return 0;

    const result = await FeeDemand.bulkWrite(ops, { session: dbSession });
    return result.upsertedCount;
  },

  /*
   * Monthly demands for ALL active students of a session
   * (optionally only one class) for ONE instalment month.
   * Run once per month by the accountant.
   */
  // generateMonthlyDemands: async ({
  //   schId,
  //   session,
  //   installmentMonthId,
  //   installmentMonthNo,
  //   classID = null,
  //   userId,
  // }) => {
  //   if (!installmentMonthId) {
  //     throw new AppError("installmentMonthId is required", 400);
  //   }

  //   console.log("schId : ", schId, "session : ", session);

  //   const feePlan = await FeePlanSetup.findOne({
  //     schId,
  //     session,
  //     headType: "monthly",
  //   }).lean();

  //   if (!feePlan) {
  //     throw new AppError(
  //       "Monthly fee plan is not set up for this session",
  //       404,
  //     );
  //   }

  //   const enrollments = await StudentEnrollment.find({
  //     schId,
  //     session,
  //     status: "active",
  //     ...(classID ? { classID } : {}),
  //   }).lean();

  //   let skippedStudents = 0;
  //   const ops = [];

  //   for (const en of enrollments) {
  //     const planClass = findPlanClass(feePlan, en.classID);
  //     if (!planClass) {
  //       skippedStudents++;
  //       continue;
  //     }
  //     console.log(planClass);
  //     ops.push(
  //       ...buildDemandOps({
  //         schId,
  //         session,
  //         studentId: en.studentId,
  //         classID: en.classID,
  //         headType: "monthly",
  //         feePlan,
  //         planHeads: planClass.heads,
  //         installmentMonthId,
  //         installmentMonthNo,
  //         userId,
  //       }),
  //     );
  //   }

  //   if (!ops.length) {
  //     return { students: enrollments.length, created: 0, skippedStudents };
  //   }

  //   console.log("ENROLLMENTS:", enrollments.length);
  //   console.log("OPS LENGTH:", ops.length);
  //   console.log("OPS:", JSON.stringify(ops, null, 2));
  //   const result = await FeeDemand.bulkWrite(ops, { ordered: false });
  //   console.log("BULK RESULT:", result);
  //   return {
  //     students: enrollments.length,
  //     created: result.upsertedCount, // rows that did not exist before
  //     skippedStudents, // class missing in the monthly plan
  //   };
  // },

  generateMonthlyDemands: async ({
    schId,
    session,
    userId,
    resolvedInstallments, // [{ classID, installmentMonthId, installmentMonthNo }]
  }) => {
    const feePlan = await FeePlanSetup.findOne({
      schId,
      session,
      headType: "monthly",
    }).lean();
 
    if (!feePlan) {
      throw new AppError("Monthly fee plan is not set up for this session", 404);
    }
 
    const classIds = resolvedInstallments.map((r) => r.classID);
 
    const enrollments = await StudentEnrollment.find({
      schId,
      session,
      status: "active",
      classID: { $in: classIds },
    }).lean();
 
    const installmentByClass = new Map(
      resolvedInstallments.map((r) => [r.classID.toString(), r]),
    );
 
    let skippedNoFeePlan = 0;
    const skippedClasses = new Set();
    const ops = [];
 
    for (const en of enrollments) {
      const classId = en.classID.toString();
 
      const planClass = findPlanClass(feePlan, en.classID);
      if (!planClass) {
        skippedNoFeePlan++;
        skippedClasses.add(classId);
        continue;
      }
 
      const inst = installmentByClass.get(classId);
 
      ops.push(
        ...buildDemandOps({
          schId,
          session,
          studentId: en.studentId,
          classID: en.classID,
          headType: "monthly",
          feePlan,
          planHeads: planClass.heads,
          installmentMonthId: inst.installmentMonthId,
          installmentMonthNo: inst.installmentMonthNo,
          userId,
        }),
      );
    }
 
    if (!ops.length) {
      return {
        students: enrollments.length,
        created: 0,
        skippedNoFeePlan,
        skippedClasses: [...skippedClasses],
      };
    }

    console.log('ops : ', ops)
 
    const result = await FeeDemand.bulkWrite(ops, { ordered: false });
    console.log("bulkWrite result:", JSON.stringify(result, null, 2));
 
    return {
      students: enrollments.length,
      created: result.upsertedCount, // rows that did not exist before
      skippedNoFeePlan, // class missing from the monthly FeePlanSetup
      skippedClasses: [...skippedClasses],
    };
  }

 

 
};
