/**
 * classSectionResolver
 * The ONLY place that knows how your Class / Section data is stored.
 * Calendar code just asks "which class-sections?" and gets back [{ clsid, secid }].
 *
 * ASSUMPTION (adjust to your schema): a Class document belongs to a school and
 * holds its sections embedded:
 *     Class = { _id, schId, name, sections: [{ _id, name }] }
 *
 * If your sections live in their own collection (Section = { _id, schId, clsid, name }),
 * only the three queries below change — see the "separate Section model" notes.
 */
const Class = require("../models/school-setting/schoolClass"); // <- point this at your real Class model

function fail(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

const toTargets = (cls) =>
  (cls.sections || []).map((s) => ({ clsid: cls._id, secid: s._id }));

/** Every section of every class in the school */
async function getAllTargets({ schId }) {
  const classes = await Class.find({ schId }).select("sections._id").lean();
  // separate Section model: const secs = await Section.find({ schId }).select("clsid").lean();
  //                         return secs.map((s) => ({ clsid: s.clsid, secid: s._id }));
  return classes.flatMap(toTargets);
}

/** Every section of ONE class */
async function getClassTargets({ schId, clsid }) {
  const cls = await Class.findOne({ _id: clsid, schId }).select("sections._id").lean();
  if (!cls) fail("Class not found in this school", 404);
  const targets = toTargets(cls);
  if (targets.length === 0) fail("This class has no sections", 404);
  // separate Section model: Section.find({ schId, clsid }).select("_id").lean()
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