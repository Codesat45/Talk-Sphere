const asyncHandler = require("express-async-handler");
const Notification = require("../models/notificationModel");

// Create notification
const createNotification = async (userId, type, title, message, meetingId, link) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      meeting: meetingId,
      link,
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

// Get user notifications
const getUserNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .populate("meeting", "title scheduledTime")
    .sort({ createdAt: -1 })
    .limit(50);

  res.json(notifications);
});

// Mark notification as read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  if (notification.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  notification.read = true;
  await notification.save();

  res.json(notification);
});

// Mark all as read
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, read: false },
    { read: true }
  );

  res.json({ message: "All notifications marked as read" });
});

// Delete notification
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  if (notification.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  await Notification.findByIdAndDelete(req.params.id);

  res.json({ message: "Notification deleted" });
});

// Get unread count
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    user: req.user._id,
    read: false,
  });

  res.json({ count });
});

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
};
