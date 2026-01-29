const express = require("express");
const {
  allMessages,
  sendMessage,
  deleteMessage,
} = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").post(protect, sendMessage);
router.delete("/:messageId", protect, deleteMessage);
router.get("/:chatId", protect, allMessages);

module.exports = router;
