const express = require("express");
const {
  allMessages,
  sendMessage,
  deleteMessage,
  editMessage,
  reactToMessage,
  deleteMessageForMe,
  deleteChatForMe,
} = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").post(protect, sendMessage);
router.put("/:messageId/delete-for-me", protect, deleteMessageForMe);
router.put("/:messageId", protect, editMessage);
router.put("/:messageId/react", protect, reactToMessage);
router.delete("/:messageId", protect, deleteMessage);
router.get("/:chatId", protect, allMessages);
router.delete("/chat/:chatId/delete-for-me", protect, deleteChatForMe);

module.exports = router;
