const express = require("express");
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} = require("../controllers/notificationControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, getUserNotifications);
router.route("/unread-count").get(protect, getUnreadCount);
router.route("/mark-all-read").put(protect, markAllAsRead);
router.route("/:id").put(protect, markAsRead).delete(protect, deleteNotification);

module.exports = router;
