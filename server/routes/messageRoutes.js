const express = require("express");
const multer = require("multer");
const {
  allMessages,
  sendMessage,
  deleteMessage,
  editMessage,
  reactToMessage,
  deleteMessageForMe,
  deleteChatForMe,
  uploadMedia,
} = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.route("/").post(protect, sendMessage);
router.post("/upload", protect, upload.single("file"), uploadMedia);
router.put("/:messageId/delete-for-me", protect, deleteMessageForMe);
router.put("/:messageId", protect, editMessage);
router.put("/:messageId/react", protect, reactToMessage);
router.delete("/:messageId", protect, deleteMessage);
router.get("/:chatId", protect, allMessages);
router.delete("/chat/:chatId/delete-for-me", protect, deleteChatForMe);

module.exports = router;
