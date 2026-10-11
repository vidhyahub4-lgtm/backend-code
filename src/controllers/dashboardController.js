const dashboardService = require("../services/dashboardService");

// GET /api/dashboard/summary?schId=&session=   (authMiddleware required)
// superAdmin: any school (schId from the query). Admin: always their own school.
async function getSummary(req, res) {
  try {
    const isSuperAdmin = req.user.userType === "superAdmin";
    const ownSchId = req.user.schid?._id || req.user.schid;
    const schId = isSuperAdmin ? req.query.schId : ownSchId;

    if (!schId) {
      return res.status(403).json({ success: false, message: "No school is linked to this account" });
    }

    const data = await dashboardService.getSummary({ schId: String(schId), session: req.query.session });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

module.exports = { getSummary };