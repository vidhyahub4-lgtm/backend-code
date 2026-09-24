const router = require("express").Router();
const schoolSettingController = require("../controllers/schoolSettingController");
const authMiddleware = require("../middileware/auth");
const uploadStudentImage = require("../middileware/uploadStudentImage");

router.post(
  "/create-sch-class",
  authMiddleware,
  schoolSettingController.createSchClass,
);
router.get(
  "/get-sch-class",
  authMiddleware,
  schoolSettingController.getSchClass,
);

router.post(
  "/create-sch-house",
  authMiddleware,
  schoolSettingController.createSchHouse,
);
router.get(
  "/get-sch-house",
  authMiddleware,
  schoolSettingController.getSchHouse,
);

router.post(
  "/create-feeplansetup",
  authMiddleware,
  schoolSettingController.createFeePlanSetup,
);
router.get(
  "/get-feeplansetup",
  authMiddleware,
  schoolSettingController.getAllFeePlanSetups,
);

router.patch(
  "/feeplansetup/:planId",
  authMiddleware,
  schoolSettingController.updateFeePlanSetup,
);

router.post(
  "/fee-head-setup",
  authMiddleware,
  schoolSettingController.feeheadsetup,
);
router.get(
  "/get-fee-head-setup",
  authMiddleware,
  schoolSettingController.getFeeHeadSetup,
);

router.post(
  "/fee-plan-type",
  authMiddleware,
  schoolSettingController.feeplantype,
);
router.get(
  "/get-fee-plan-type",
  authMiddleware,
  schoolSettingController.getFeePlanType,
);

//reg registartion
router.post(
  "/new-registration",
  authMiddleware,
  uploadStudentImage.single("Image"),
  schoolSettingController.createNewRegistration,
);
router.get(
  "/get-all-newregstration",
  authMiddleware,
  schoolSettingController.getAllNewRegistration,
);

router.get('/get-register-studbyid', authMiddleware,schoolSettingController.getRegisterStudentByID )

// router.post("/stud-admission",authMiddleware, schoolSettingController.admitStudent);
router.post(
  "/stud-admission",
  authMiddleware,
  schoolSettingController.admitStudent,
);
router.get(
  "/enrollment-list",
  authMiddleware,
  schoolSettingController.listEnrollments,
);

module.exports = router;
