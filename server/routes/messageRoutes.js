const express = require("express");
const {
  allMessages,
  sendMessage,
  deleteMessage,
  editMessage,
  reactToMessage,
} = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").post(protect, sendMessage);
router.put("/:messageId", protect, editMessage);
router.put("/:messageId/react", protect, reactToMessage);
router.delete("/:messageId", protect, deleteMessage);
router.get("/:chatId", protect, allMessages);

module.exports = router;
