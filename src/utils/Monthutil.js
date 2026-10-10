/**
 * Month helpers for the Calendar model.
 * An academic session like '2026-27' runs April 2026 -> March 2027.
 */
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// order the months appear in a session document
const SESSION_ORDER = [3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2]; // Apr..Mar (JS month index)

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Month id = 3 random digits in front + month number (1-12) + 2 random digits at the back.
 * e.g. April (4) -> 731 + 4 + 52 = 731452 ; October (10) -> 204 + 10 + 87 = 2041087
 * Front digits start at 1-9 so the number never loses a leading zero.
 */
function makeMonthId(monthNo) {
  const front = rand(100, 999);
  const back = String(rand(0, 99)).padStart(2, "0");
  return Number(`${front}${monthNo}${back}`);
}

/** Get the month number (1-12) back out of an id */
function monthNoFromId(id) {
  return Number(String(id).slice(3, -2));
}

/** '2026-27' -> 2026 */
function sessionStartYear(session) {
  const y = parseInt(String(session).slice(0, 4), 10);
  if (!/^\d{4}-\d{2}$/.test(String(session)) || isNaN(y)) {
    const err = new Error("session must look like '2026-27'");
    err.status = 400;
    throw err;
  }
  return y;
}

/** Session date range: [start, end) as UTC dates */
function sessionRange(session) {
  const y = sessionStartYear(session);
  return { start: new Date(Date.UTC(y, 3, 1)), end: new Date(Date.UTC(y + 1, 3, 1)) };
}

/** Empty 12-month skeleton for a session, April first */
function buildSessionMonths(session) {
  sessionStartYear(session); // validates format
  return SESSION_ORDER.map((idx) => ({
    month: MONTH_NAMES[idx],
    id: makeMonthId(idx + 1),
    dates: [],
  }));
}

module.exports = {
  MONTH_NAMES,
  makeMonthId,
  monthNoFromId,
  sessionRange,
  buildSessionMonths,
};