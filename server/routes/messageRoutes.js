const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  allMessages,
  sendMessage,
  deleteMessage,
  editMessage,
  reactToMessage,
  deleteMessageForMe,
  deleteChatForMe,
  uploadMedia,
  saveCallHistory,
  getCallHistory,
} = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/tmp'); // Use /tmp directory for temporary files
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    console.log("File received:", file.originalname, file.mimetype);
    cb(null, true);
  }
});

router.route("/").post(protect, sendMessage);
router.post("/upload", protect, upload.single("file"), uploadMedia);
router.post("/call-history", protect, saveCallHistory);
router.get("/call-history/:chatId", protect, getCallHistory);
router.put("/:messageId/delete-for-me", protect, deleteMessageForMe);
router.put("/:messageId", protect, editMessage);
router.put("/:messageId/react", protect, reactToMessage);
router.delete("/:messageId", protect, deleteMessage);
router.get("/:chatId", protect, allMessages);
router.delete("/chat/:chatId/delete-for-me", protect, deleteChatForMe);

module.exports = router;
