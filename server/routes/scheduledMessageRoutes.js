const express = require("express");
const {
  createScheduledMessage,
  getScheduledMessages,
  cancelScheduledMessage,
  setAutoReply,
  getAutoReply,
  deleteAutoReply,
} = require("../controllers/scheduledMessageControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/scheduled").post(protect, createScheduledMessage).get(protect, getScheduledMessages);
router.route("/scheduled/:id").delete(protect, cancelScheduledMessage);
router.route("/auto-reply").post(protect, setAutoReply).get(protect, getAutoReply).delete(protect, deleteAutoReply);

module.exports = router;
