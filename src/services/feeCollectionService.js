// const mongoose = require("mongoose");
// const FeeDemand = require("../models/school-setting/feeDemand");
// const FeeReceipt = require("../models/school-setting/Feereceipt");
// const FeeCreditLedger = require("../models/school-setting/Feecreditledger");
// const Counter = require("../models/school-setting/counter");
// const AppError = require("../utils/appError");
// const StudentAdmission = require("../models/school-setting/Studentadmission");

// const PAY_MODES = ["cash", "upi", "cheque", "online", "card"];

// /*
//  * Advance balance = total credits - total debits in the ledger.
//  */
// const getAdvanceBalance = async (schId, studentId, dbSession = null) => {
//   const agg = FeeCreditLedger.aggregate([
//     {
//       $match: {
//         schId: new mongoose.Types.ObjectId(schId),
//         studentId: new mongoose.Types.ObjectId(studentId),
//       },
//     },
//     { $group: { _id: "$type", total: { $sum: "$amount" } } },
//   ]);
//   if (dbSession) agg.session(dbSession);

//   const rows = await agg;
//   const credit = rows.find((r) => r._id === "credit")?.total ?? 0;
//   const debit = rows.find((r) => r._id === "debit")?.total ?? 0;
//   return credit - debit;
// };

// module.exports = {
//   getAdvanceBalance,

//   /*
//    * Everything the fee counter screen needs for one student.
//    */
//   getStudentDues: async ({ schId, studentId, session }) => {
//     const demands = await FeeDemand.find({
//       schId,
//       studentId,
//       session,
//       status: { $in: ["unpaid", "partial"] },
//     })
//       .sort({ installmentMonthNo: 1, headType: 1 })
//       .lean();

//     const items = demands.map((d) => ({
//       demandId: d._id,
//       headType: d.headType,
//       feetype: d.feetype,
//       installmentMonthId: d.installmentMonthId,
//       installmentMonthNo: d.installmentMonthNo,
//       netAmount: d.netAmount,
//       paidAmount: d.paidAmount,
//       dueAmount: d.netAmount - d.paidAmount, // derived, never stored
//       status: d.status,
//     }));

//     return {
//       items,
//       totalDue: items.reduce((sum, i) => sum + i.dueAmount, 0),
//       advanceBalance: await getAdvanceBalance(schId, studentId),
//     };
//   },

//   getStudentPaymentDetail: async ({ schId, studentId, session }) => {
//     const paydet = await FeeDemand.find({
//       schId,
//       studentId,
//       session,
//       headType: "monthly",
//     })
//       .select("_id installmentMonthNo feetype netAmount paidAmount")
//       .lean();

//     const installments = new Map();

//     for (const doc of paydet) {
//       console.log("doc:", doc);

//       const instNo = doc.installmentMonthNo;

//       if (!installments.has(instNo)) {
//         installments.set(instNo, {
//           // _id: doc._id,
//           instno: instNo,
//           feedet: [],
//           amt: 0,
//           due: 0,
//         });
//       }

//       const inst = installments.get(instNo);

//       const netAmount = Number(doc.netAmount || 0);
//       const paidAmount = Number(doc.paidAmount || 0);

//       const dueAmount = Math.max(netAmount - paidAmount, 0);

//       inst.feedet.push({
//         feetype: doc.feetype,
//         amt: netAmount,
//         _id: doc._id,
//       });

//       inst.amt += netAmount;
//       inst.due += dueAmount;
//     }

//     const pinst = [];
//     const dinst = [];

//     // Total due
//     let du = 0;

//     for (const inst of installments.values()) {
//       if (inst.due > 0) {
//         dinst.push({
//           _id: inst._id,
//           instno: inst.instno,
//           feedet: inst.feedet,
//           amt: inst.amt,
//         });

//         // Add installment due to total due
//         du += inst.due;
//       } else {
//         pinst.push({
//           _id: inst._id,
//           instno: inst.instno,
//         });
//       }
//     }

//     // Get total advance from active receipts
//     const advanceResult = await FeeReceipt.aggregate([
//       {
//         $match: {
//           schId: new mongoose.Types.ObjectId(schId),
//           studentId: new mongoose.Types.ObjectId(studentId),
//           session: new mongoose.Types.ObjectId(session),
//           status: "active",
//           // advanceAmount: { $gt: 0 },
//         },
//       },
//       {
//         $sort: {
//           paymentDate: -1,
//           _id: -1,
//         },
//       },
//       {
//         $group: {
//           _id: null,

//           // Total advance
//           adv: {
//             $sum: "$advanceAmount",
//           },

//           // Latest receipt ID having advance
//           lrcptid: {
//             $first: "$_id",
//           },
//         },
//       },
//     ]);

//     console.log("last receipt:", advanceResult);

//     const adv = Number(advanceResult[0]?.adv || 0);
//     const lrcptid = advanceResult[0]?.lrcptid || null;

//     return {
//       pinst,
//       dinst,
//       adv,
//       du,
//       lrcptid,
//     };
//   },

//   getAdmissionDues: async ({ schId, studentId, session }) => {
//     const demands = await FeeDemand.find({
//       schId,
//       studentId,
//       session,
//       headType: "admission",
//       status: { $in: ["unpaid", "partial"] },
//     })
//       .sort({ feetype: 1 })
//       .lean();

//     const items = demands.map((d) => ({
//       demandId: d._id,
//       feetype: d.feetype,
//       netAmount: d.netAmount,
//       paidAmount: d.paidAmount,
//       dueAmount: d.netAmount - d.paidAmount, // derived, never stored
//       status: d.status,
//     }));

//     return {
//       items,
//       totalDue: items.reduce((sum, i) => sum + i.dueAmount, 0),
//       advanceBalance: await getAdvanceBalance(schId, studentId),
//     };
//   },

//   /*
//    * Monthly due for one student — every unpaid/partial instalment,
//    * grouped by month so the counter screen can show "January: ₹500 due".
//    */
//   getMonthlyDues: async ({ schId, studentId, session }) => {
//     const demands = await FeeDemand.find({
//       schId,
//       studentId,
//       session,
//       headType: "monthly",
//       status: { $in: ["unpaid", "partial"] },
//     })
//       .sort({ installmentMonthNo: 1, feetype: 1 })
//       .lean();

//     const monthMap = new Map();

//     demands.forEach((d) => {
//       const key = String(d.installmentMonthId);
//       const dueAmount = d.netAmount - d.paidAmount; // derived, never stored

//       if (!monthMap.has(key)) {
//         monthMap.set(key, {
//           installmentMonthId: d.installmentMonthId,
//           installmentMonthNo: d.installmentMonthNo,
//           items: [],
//           monthDue: 0,
//         });
//       }

//       const month = monthMap.get(key);
//       month.items.push({
//         demandId: d._id,
//         feetype: d.feetype,
//         netAmount: d.netAmount,
//         paidAmount: d.paidAmount,
//         dueAmount,
//         status: d.status,
//       });
//       month.monthDue += dueAmount;
//     });

//     const months = [...monthMap.values()].sort(
//       (a, b) => a.installmentMonthNo - b.installmentMonthNo,
//     );

//     return {
//       months,
//       totalDue: months.reduce((sum, m) => sum + m.monthDue, 0),
//       advanceBalance: await getAdvanceBalance(schId, studentId),
//     };
//   },

//   /*
//    * Collect fees.
//    * lines          = [{ demandId, amount }]  what the parent is paying now
//    * advanceAmount  = extra money kept as advance credit
//    * Cash collected = sum(lines) + advanceAmount
//    *
//    * Receipt + demand updates + advance entry are ONE transaction.
//    */
//   collectFee: async ({
//     schId,
//     userId,
//     session,
//     studentId,
//     mode,
//     refNo,
//     paymentDate,
//     lines,
//     advanceAmount = 0,
//   }) => {
//     if (!PAY_MODES.includes(mode)) {
//       throw new AppError("Invalid payment mode", 400);
//     }
//     if (!Array.isArray(lines) || !lines.length) {
//       throw new AppError("At least one fee line is required", 400);
//     }

//     const ids = lines.map((l) => String(l.demandId));
//     if (new Set(ids).size !== ids.length) {
//       throw new AppError("Duplicate fee line in request", 400);
//     }

//     for (const l of lines) {
//       const amt = Number(l.amount);
//       if (!Number.isFinite(amt) || amt <= 0) {
//         throw new AppError("Each line amount must be greater than 0", 400);
//       }
//     }

//     const advance = Number(advanceAmount) || 0;
//     if (advance < 0) throw new AppError("Advance cannot be negative", 400);

//     const dbSession = await mongoose.startSession();
//     let receipt;

//     try {
//       await dbSession.withTransaction(async () => {
//         // load demands INSIDE the transaction so two counters can't overpay
//         const demands = await FeeDemand.find({
//           _id: { $in: ids },
//           schId,
//           studentId,
//           session,
//         }).session(dbSession);
//         console.log("2. Demands loaded:", demands.length);

//         if (demands.length !== ids.length) {
//           throw new AppError(
//             "One or more fee items not found for this student",
//             404,
//           );
//         }

//         await StudentAdmission.updateOne(
//           { _id: studentId, schId, pystatus: "pending" },
//           { $set: { pystatus: "done" } },
//           { session: dbSession },
//         );

//         const demandMap = new Map(demands.map((d) => [d._id.toString(), d]));
//         const receiptLines = [];

//         for (const l of lines) {
//           const d = demandMap.get(String(l.demandId));
//           const amt = Number(l.amount);

//           if (d.status === "cancelled") {
//             throw new AppError(`${d.feetype} demand is cancelled`, 400);
//           }

//           const due = d.netAmount - d.paidAmount;
//           if (amt > due) {
//             throw new AppError(
//               `Amount for "${d.feetype}" exceeds the due amount (${due})`,
//               400,
//             );
//           }

//           d.paidAmount += amt;
//           await d.save({ session: dbSession }); // model hook updates status

//           receiptLines.push({
//             demandId: d._id,
//             headType: d.headType,
//             feetype: d.feetype,
//             installmentMonthId: d.installmentMonthId,
//             amount: amt,
//           });
//         }

//         const receiptNo = await Counter.next(
//           `receipt:${schId}:${session}`,
//           dbSession,
//         );

//         [receipt] = await FeeReceipt.create(
//           [
//             {
//               schId,
//               session,
//               studentId,
//               receiptNo,
//               paymentDate: paymentDate || new Date(),
//               mode,
//               refNo,
//               lines: receiptLines,
//               advanceAmount: advance,
//               createdby: userId,
//             },
//           ],
//           { session: dbSession },
//         );

//         if (advance > 0) {
//           await FeeCreditLedger.create(
//             [
//               {
//                 schId,
//                 studentId,
//                 session,
//                 type: "credit",
//                 amount: advance,
//                 receiptId: receipt._id,
//                 reason: "advance",
//                 createdby: userId,
//               },
//             ],
//             { session: dbSession },
//           );
//         }
//       });
//     } catch (error) {
//       console.error("❌ collectFee transaction error:");
//       console.error("message:", error.message);
//       console.error("name:", error.name);
//       console.error("stack:", error.stack);

//       throw error;
//     } finally {
//       await dbSession.endSession();
//     }
//     return receipt;
//   },

//   /*
//    * Cancel a receipt: reverse every demand it paid and any advance it created.
//    * The receipt stays in the database with status "cancelled".
//    */
//   cancelReceipt: async ({ schId, userId, receiptId, reason }) => {
//     if (!reason?.trim()) {
//       throw new AppError("Cancel reason is required", 400);
//     }

//     const dbSession = await mongoose.startSession();
//     let receipt;

//     try {
//       await dbSession.withTransaction(async () => {
//         receipt = await FeeReceipt.findOne({ _id: receiptId, schId }).session(
//           dbSession,
//         );

//         if (!receipt) throw new AppError("Receipt not found", 404);
//         if (receipt.status === "cancelled") {
//           throw new AppError("Receipt is already cancelled", 400);
//         }

//         for (const line of receipt.lines) {
//           const d = await FeeDemand.findById(line.demandId).session(dbSession);
//           if (!d) continue;
//           d.paidAmount = Math.max(0, d.paidAmount - line.amount);
//           await d.save({ session: dbSession });
//         }

//         if (receipt.advanceAmount > 0) {
//           const balance = await getAdvanceBalance(
//             schId,
//             receipt.studentId,
//             dbSession,
//           );
//           if (balance < receipt.advanceAmount) {
//             throw new AppError(
//               "The advance from this receipt has already been used, so it cannot be cancelled",
//               400,
//             );
//           }

//           await FeeCreditLedger.create(
//             [
//               {
//                 schId,
//                 studentId: receipt.studentId,
//                 session: receipt.session,
//                 type: "debit",
//                 amount: receipt.advanceAmount,
//                 receiptId: receipt._id,
//                 reason: "cancellation",
//                 createdby: userId,
//               },
//             ],
//             { session: dbSession },
//           );
//         }

//         receipt.status = "cancelled";
//         receipt.cancelledAt = new Date();
//         receipt.cancelledBy = userId;
//         receipt.cancelReason = reason.trim();
//         await receipt.save({ session: dbSession });
//       });
//     } finally {
//       await dbSession.endSession();
//     }

//     return receipt;
//   },

//   getReceipt: async ({ schId, receiptId }) => {
//     const receipt = await FeeReceipt.findOne({ _id: receiptId, schId })
//       .populate({ path: "studentId", populate: { path: "regno" } })
//       .populate("session")
//       .lean();

//     if (!receipt) throw new AppError("Receipt not found", 404);
//     return receipt;
//   },

//   /*
//    * Filters: session, studentId, from/to (payment date). Use for daily collection.
//    */
//   listReceipts: async ({ schId, session, studentId, from, to }) => {
//     const filter = { schId };
//     if (session) filter.session = session;
//     if (studentId) filter.studentId = studentId;
//     if (from || to) {
//       filter.paymentDate = {};
//       if (from) filter.paymentDate.$gte = new Date(from);
//       if (to) {
//         const end = new Date(to);
//         end.setHours(23, 59, 59, 999);
//         filter.paymentDate.$lte = end;
//       }
//     }

//     return await FeeReceipt.find(filter)
//       .populate({ path: "studentId", select: "admno regno" })
//       .sort({ paymentDate: -1, receiptNo: -1 })
//       .lean();
//   },
// };



const mongoose = require("mongoose");
const FeeDemand = require("../models/school-setting/feeDemand");
const FeeReceipt = require("../models/school-setting/Feereceipt");
const FeeCreditLedger = require("../models/school-setting/Feecreditledger");
const Counter = require("../models/school-setting/counter");
const AppError = require("../utils/appError");

const PAY_MODES = ["cash", "upi", "cheque", "online", "card"];

/*
 * Read-only summary of a student's running account.
 * Current due / current advance come from the LATEST receipt's own
 * cdue/cAdv — that's what the next receipt's pdue / advance will be.
 */
const getLedgerSummary = async (schId, studentId, dbSession = null) => {
  const q = FeeCreditLedger.findOne({ schId, studentId });
  if (dbSession) q.session(dbSession);
  const ledger = await q.lean();

  if (!ledger) return { totamt: 0, totcons: 0, cdue: 0, cadv: 0, lastrpt: null };

  return {
    totamt: ledger.totamt,
    totcons: ledger.totcons,
    cdue: ledger.lastrpt?.cdue || 0,
    cadv: ledger.lastrpt?.cadv || 0,
    lastrpt: ledger.lastrpt,
  };
};

module.exports = {
  getLedgerSummary,

  /*
   * Admission due for one student — admission FeePlanSetup heads only
   * (e.g. "admission", "smart erp").
   */
  getAdmissionDues: async ({ schId, studentId, session }) => {
    const demands = await FeeDemand.find({
      schId,
      studentId,
      session,
      headType: "admission",
      status: { $in: ["unpaid", "partial"] },
    })
      .sort({ feetype: 1 })
      .lean();

    const items = demands.map((d) => ({
      demandId: d._id,
      feetype: d.feetype,
      planAmount: d.planAmount,
      concession: d.concession,
      netAmount: d.netAmount,
      paidAmount: d.paidAmount,
      dueAmount: d.netAmount - d.paidAmount, // derived, never stored
      status: d.status,
    }));

    const ledger = await getLedgerSummary(schId, studentId);

    return {
      items,
      totalDue: items.reduce((sum, i) => sum + i.dueAmount, 0),
      cdue: ledger.cdue, // running account due, separate from per-demand due above
      cadv: ledger.cadv,
    };
  },

  /*
   * Monthly due for one student — every unpaid/partial instalment,
   * grouped by month so the counter screen can show "January: ₹500 due".
   */
  getMonthlyDues: async ({ schId, studentId, session }) => {
    const demands = await FeeDemand.find({
      schId,
      studentId,
      session,
      headType: "monthly",
      status: { $in: ["unpaid", "partial"] },
    })
      .sort({ installmentMonthNo: 1, feetype: 1 })
      .lean();

    const monthMap = new Map();

    demands.forEach((d) => {
      const key = String(d.installmentMonthId);
      const dueAmount = d.netAmount - d.paidAmount; // derived, never stored

      if (!monthMap.has(key)) {
        monthMap.set(key, {
          installmentMonthId: d.installmentMonthId,
          installmentMonthNo: d.installmentMonthNo,
          items: [],
          monthDue: 0,
        });
      }

      const month = monthMap.get(key);
      month.items.push({
        demandId: d._id,
        feetype: d.feetype,
        planAmount: d.planAmount,
        concession: d.concession,
        netAmount: d.netAmount,
        paidAmount: d.paidAmount,
        dueAmount,
        status: d.status,
      });
      month.monthDue += dueAmount;
    });

    const months = [...monthMap.values()].sort(
      (a, b) => a.installmentMonthNo - b.installmentMonthNo,
    );

    const ledger = await getLedgerSummary(schId, studentId);

    return {
      months,
      totalDue: months.reduce((sum, m) => sum + m.monthDue, 0),
      cdue: ledger.cdue,
      cadv: ledger.cadv,
    };
  },

  /*
   * Collect fees — full counter breakdown.
   *
   * lines = [{ demandId, amount, concession }]
   *   amount     = applied toward that demand's due, AFTER concession
   *   concession = concession granted on that demand in THIS receipt
   *                (added to the demand's existing concession)
   *
   * lateFine, misc = flat extra charges for this receipt
   * paidAmount     = total cash actually received from the parent
   *
   * Pulls pdue (previous due) and the previous advance from the
   * student's FeeCreditLedger, computes:
   *   instotamt   = sum of line planAmounts (gross)
   *   totalAmount = instotamt + lfine + misc + pdue
   *   cons        = sum of line concessions
   *   payableamt  = totalAmount - cons - previousAdvance
   *   paidamt     = min(paidAmount, payableamt)
   *   cdue        = payableamt - paidamt   (if paidAmount < payableamt)
   *   cAdv        = paidAmount - payableamt (if paidAmount > payableamt)
   *
   * Demand + receipt + ledger updates are ONE transaction.
   */
  collectFee: async ({
    schId,
    userId,
    session,
    studentId,
    mode,
    refNo,
    paymentDate,
    rptnm,
    lines,
    lateFine = 0,
    misc = 0,
    paidAmount,
  }) => {
    if (!PAY_MODES.includes(mode)) {
      throw new AppError("Invalid payment mode", 400);
    }
    if (!Array.isArray(lines) || !lines.length) {
      throw new AppError("At least one fee line is required", 400);
    }

    const ids = lines.map((l) => String(l.demandId));
    if (new Set(ids).size !== ids.length) {
      throw new AppError("Duplicate fee line in request", 400);
    }

    for (const l of lines) {
      const amt = Number(l.amount);
      if (!Number.isFinite(amt) || amt < 0) {
        throw new AppError("Each line amount must be 0 or more", 400);
      }
      const cons = Number(l.concession) || 0;
      if (cons < 0) throw new AppError("Concession cannot be negative", 400);
    }

    const lfine = Number(lateFine) || 0;
    const miscAmt = Number(misc) || 0;
    if (lfine < 0 || miscAmt < 0) {
      throw new AppError("lateFine and misc cannot be negative", 400);
    }

    const received = Number(paidAmount);
    if (!Number.isFinite(received) || received < 0) {
      throw new AppError("paidAmount is required and cannot be negative", 400);
    }

    const dbSession = await mongoose.startSession();
    let receipt;

    try {
      await dbSession.withTransaction(async () => {
        // 1. the student's running account — create one if this is their first payment ever
        let ledger = await FeeCreditLedger.findOne({ schId, studentId }).session(
          dbSession,
        );
        if (!ledger) {
          [ledger] = await FeeCreditLedger.create(
            [
              {
                schId,
                studentId,
                session,
                totamt: 0,
                totcons: 0,
                lastrpt: { lastrptid: null, lastpayamt: 0, pdue: 0, cdue: 0, cadv: 0 },
              },
            ],
            { session: dbSession },
          );
        }

        const pdue = ledger.lastrpt?.cdue || 0;
        const prevAdvance = ledger.lastrpt?.cadv || 0;

        // 2. load demands INSIDE the transaction so two counters can't overpay
        const demands = await FeeDemand.find({
          _id: { $in: ids },
          schId,
          studentId,
          session,
        }).session(dbSession);

        if (demands.length !== ids.length) {
          throw new AppError("One or more fee items not found for this student", 404);
        }

        const demandMap = new Map(demands.map((d) => [d._id.toString(), d]));

        let instotamt = 0;
        let consTotal = 0;
        const receiptLines = [];

        for (const l of lines) {
          const d = demandMap.get(String(l.demandId));

          if (d.status === "cancelled") {
            throw new AppError(`${d.feetype} demand is cancelled`, 400);
          }

          const lineConcession = Number(l.concession) || 0;
          const lineAmount = Number(l.amount);

          const newConcession = (d.concession || 0) + lineConcession;
          if (newConcession > d.planAmount) {
            throw new AppError(
              `Concession on "${d.feetype}" cannot exceed the plan amount`,
              400,
            );
          }

          const newNetAmount = d.planAmount - newConcession;
          const due = newNetAmount - d.paidAmount;
          if (lineAmount > due) {
            console.log('Line Amount: ', lineAmount, 'Due: ', due);
            throw new AppError(
              `Amount for "${d.feetype}" exceeds the due amount (${due}) after concession`,
              400,
            );
          }

          d.concession = newConcession;
          d.paidAmount += lineAmount;
          await d.save({ session: dbSession }); // hook recomputes netAmount + status

          instotamt += d.planAmount;
          consTotal += lineConcession;

          receiptLines.push({
            demandId: d._id,
            headType: d.headType,
            feetype: d.feetype,
            installmentMonthId: d.installmentMonthId,
            planAmount: d.planAmount,
            concession: lineConcession,
            amount: lineAmount,
          });
        }

        // 3. receipt-level totals
        const totalAmount = instotamt + lfine + miscAmt + pdue;
        console.log('totalAmount : ', totalAmount, 'instotamt : ', instotamt, 'lfine : ', 'consTotal',consTotal);
        const payableamt = Math.max(0, totalAmount - consTotal - prevAdvance);
                
        let paidamt;
        let cdue;
        let cAdv;
        console.log('rec : ', received, 'payableamt : ', payableamt, 'totalAmount : ', totalAmount);
        if (received > payableamt) {
          paidamt = payableamt;
          cAdv = received - payableamt;
          cdue = 0;
        }else if(received === payableamt){
          paidamt = payableamt;
          cAdv = 0;
          cdue = 0;
        } else {
          paidamt = received;
          cdue = payableamt - received;
          cAdv = 0;
        }

  
        const receiptNo = await Counter.next(
          `receipt:${schId}:${session}`,
          dbSession,
        );

        [receipt] = await FeeReceipt.create(
          [
            {
              schId,
              session,
              studentId,
              receiptNo,
              rptnm: rptnm || `Receipt #${receiptNo}`,
              paymentDate: paymentDate || new Date(),
              mode,
              refNo,
              lines: receiptLines,
              pdue,
              instotamt,
              lfine,
              misc: miscAmt,
              totalAmount,
              cons: consTotal,
              payableamt,
              paidamt,
              cdue,
              cAdv,
              createdby: userId,
            },
          ],
          { session: dbSession },
        );

        // 4. update the student's running account
        ledger.totamt += received;
        ledger.totcons += consTotal;
        ledger.session = session;
        ledger.lastrpt = {
          lastrptid: receipt._id,
          lastpayamt: received,
          pdue,
          cdue,
          cadv: cAdv,
        };
        await ledger.save({ session: dbSession });
      });
    } finally {
      await dbSession.endSession();
    }

    return receipt;
  },

  /*
   * Cancel a receipt. Only the student's most recent ACTIVE receipt can
   * be cancelled — the running ledger is a single rolling state, not a
   * log, so cancelling an older receipt out of order can't be rolled
   * back correctly without replaying every receipt after it. Cancel
   * newer receipts first if one further back needs voiding.
   *
   * On cancel:
   *  - every demand this receipt touched: paidAmount and concession are
   *    reversed, and status is recomputed by the demand's own save hook
   *    (back to "unpaid" or "partial") — the demand stays reusable,
   *    so the fee can be collected again on a later receipt
   *  - the receipt itself is marked "cancelled", never deleted
   *  - the student's ledger totals (totamt, totcons) are reduced, and
   *    lastrpt rolls back to whatever the previous active receipt was
   */
  cancelReceipt: async ({ schId, userId, receiptId, reason }) => {
    if (!reason?.trim()) {
      throw new AppError("Cancel reason is required", 400);
    }

    const dbSession = await mongoose.startSession();
    let receipt;

    try {
      await dbSession.withTransaction(async () => {
        receipt = await FeeReceipt.findOne({ _id: receiptId, schId }).session(
          dbSession,
        );

        if (!receipt) throw new AppError("Receipt not found", 404);
        if (receipt.status === "cancelled") {
          throw new AppError("Receipt is already cancelled", 400);
        }

        const latestActive = await FeeReceipt.findOne({
          schId,
          studentId: receipt.studentId,
          status: "active",
        })
          .sort({ receiptNo: -1 })
          .session(dbSession);

        if (!latestActive || latestActive._id.toString() !== receipt._id.toString()) {
          throw new AppError(
            "Only the student's most recent receipt can be cancelled. Cancel newer receipts first.",
            400,
          );
        }

        // reverse every demand this receipt touched — stays reusable,
        // the save hook recomputes status (unpaid/partial) from the
        // reversed paidAmount/concession, same as any other save
        for (const line of receipt.lines) {
          const d = await FeeDemand.findById(line.demandId).session(dbSession);
          if (!d) continue;
          d.paidAmount = Math.max(0, d.paidAmount - line.amount);
          d.concession = Math.max(0, d.concession - line.concession);
          await d.save({ session: dbSession });
        }

        receipt.status = "cancelled";
        receipt.cancelledAt = new Date();
        receipt.cancelledBy = userId;
        receipt.cancelReason = reason.trim();
        await receipt.save({ session: dbSession });

        // roll the ledger back to whatever the prior active receipt left it at
        const priorReceipt = await FeeReceipt.findOne({
          schId,
          studentId: receipt.studentId,
          status: "active",
        })
          .sort({ receiptNo: -1 })
          .session(dbSession);

        const ledger = await FeeCreditLedger.findOne({
          schId,
          studentId: receipt.studentId,
        }).session(dbSession);

        if (ledger) {
          const receivedThisReceipt = receipt.paidamt + receipt.cAdv;
          ledger.totamt = Math.max(0, ledger.totamt - receivedThisReceipt);
          ledger.totcons = Math.max(0, ledger.totcons - receipt.cons);
          ledger.lastrpt = priorReceipt
            ? {
                lastrptid: priorReceipt._id,
                lastpayamt: priorReceipt.paidamt + priorReceipt.cAdv,
                pdue: priorReceipt.pdue,
                cdue: priorReceipt.cdue,
                cadv: priorReceipt.cAdv,
              }
            : { lastrptid: null, lastpayamt: 0, pdue: 0, cdue: 0, cadv: 0 };
          await ledger.save({ session: dbSession });
        }
      });
    } finally {
      await dbSession.endSession();
    }

    return receipt;
  },

  getReceipt: async ({ schId, receiptId }) => {
    const receipt = await FeeReceipt.findOne({ _id: receiptId, schId })
      .populate({ path: "studentId", populate: { path: "regno" } })
      .populate("session")
      .lean();

    if (!receipt) throw new AppError("Receipt not found", 404);
    return receipt;
  },

  /*
   * Filters: session, studentId, from/to (payment date). Use for daily collection.
   */
  listReceipts: async ({ schId, session, studentId, from, to }) => {
    const filter = { schId };
    if (session) filter.session = session;
    if (studentId) filter.studentId = studentId;
    if (from || to) {
      filter.paymentDate = {};
      if (from) filter.paymentDate.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        filter.paymentDate.$lte = end;
      }
    }

    return await FeeReceipt.find(filter)
      .populate({ path: "studentId", select: "admno regno" })
      .sort({ paymentDate: -1, receiptNo: -1 })
      .lean();
  },
};
