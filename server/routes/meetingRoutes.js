const express = require("express");
const {
  createMeeting,
  getUserMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  uploadMeetingFile,
} = require("../controllers/meetingControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").post(protect, createMeeting).get(protect, getUserMeetings);
router.route("/:id").get(protect, getMeetingById).put(protect, updateMeeting).delete(protect, deleteMeeting);
router.route("/upload-file").post(protect, uploadMeetingFile);

module.exports = router;
