/**
 * classSectionResolver
 * The ONLY place that knows how Class / Section data is stored.
 * Calendar code just asks "which class-sections?" and gets back [{ clsid, secid }].
 *
 * Real schema (models/school-setting/schoolClass.js): ONE SchClass document per class per school:
 *   { schoolID, classID (master Class _id), sectionID: [master Section _id, ...], schCode }
 * clsid  = master Class _id   (same id the students / enrollments use as classID)
 * secid  = master Section _id
 */
const SchClass = require("../models/school-setting/schoolClass");

function fail(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

const toTargets = (doc) =>
  (doc.sectionID || []).map((secid) => ({ clsid: doc.classID, secid }));

/** Every section of every class in the school */
async function getAllTargets({ schId }) {
  const docs = await SchClass.find({ schoolID: schId }).select("classID sectionID").lean();
  return docs.flatMap(toTargets);
}

/** Every section of ONE class */
async function getClassTargets({ schId, clsid }) {
  const doc = await SchClass.findOne({ schoolID: schId, classID: clsid })
    .select("classID sectionID")
    .lean();
  if (!doc) fail("Class not found in this school", 404);
  const targets = toTargets(doc);
  if (targets.length === 0) fail("This class has no sections", 404);
  return targets;
}

/** Specific sections of ONE class (each must really belong to that class) */
async function getSectionTargets({ schId, clsid, secids }) {
  const all = await getClassTargets({ schId, clsid });
  const valid = new Set(all.map((t) => String(t.secid)));

  const unique = [...new Set(secids.map(String))];
  const bad = unique.filter((id) => !valid.has(id));
  if (bad.length) fail(`Section(s) do not belong to this class: ${bad.join(", ")}`);

  return unique.map((secid) => ({ clsid, secid }));
}

module.exports = { getAllTargets, getClassTargets, getSectionTargets };