const asyncHandler = require("express-async-handler");
const ScheduledMessage = require("../models/scheduledMessageModel");
const AutoReply = require("../models/autoReplyModel");
const Message = require("../models/messageModel");

// Create scheduled message
const createScheduledMessage = asyncHandler(async (req, res) => {
  const { chatId, content, scheduledTime, messageType, mediaUrl } = req.body;

  if (!chatId || !content || !scheduledTime) {
    return res.status(400).json({ message: "Chat, content, and scheduled time are required" });
  }

  const scheduledMessage = await ScheduledMessage.create({
    sender: req.user._id,
    chat: chatId,
    content,
    scheduledTime,
    messageType: messageType || "text",
    mediaUrl,
  });

  const populated = await ScheduledMessage.findById(scheduledMessage._id)
    .populate("sender", "name pic")
    .populate("chat");

  res.status(201).json(populated);
});

// Get user's scheduled messages
const getScheduledMessages = asyncHandler(async (req, res) => {
  const messages = await ScheduledMessage.find({
    sender: req.user._id,
    status: "pending",
  })
    .populate("sender", "name pic")
    .populate("chat")
    .sort({ scheduledTime: 1 });

  res.json(messages);
});

// Cancel scheduled message
const cancelScheduledMessage = asyncHandler(async (req, res) => {
  const message = await ScheduledMessage.findById(req.params.id);

  if (!message) {
    return res.status(404).json({ message: "Scheduled message not found" });
  }

  if (message.sender.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  message.status = "cancelled";
  await message.save();

  res.json({ message: "Scheduled message cancelled" });
});

// Create/Update auto reply
const setAutoReply = asyncHandler(async (req, res) => {
  const { message, enabled, startTime, endTime, applyToAll, specificChats } = req.body;

  if (!message) {
    return res.status(400).json({ message: "Auto reply message is required" });
  }

  let autoReply = await AutoReply.findOne({ user: req.user._id });

  if (autoReply) {
    autoReply.message = message;
    autoReply.enabled = enabled !== undefined ? enabled : true;
    autoReply.startTime = startTime;
    autoReply.endTime = endTime;
    autoReply.applyToAll = applyToAll !== undefined ? applyToAll : true;
    autoReply.specificChats = specificChats || [];
    await autoReply.save();
  } else {
    autoReply = await AutoReply.create({
      user: req.user._id,
      message,
      enabled: enabled !== undefined ? enabled : true,
      startTime,
      endTime,
      applyToAll: applyToAll !== undefined ? applyToAll : true,
      specificChats: specificChats || [],
    });
  }

  res.json(autoReply);
});

// Get auto reply settings
const getAutoReply = asyncHandler(async (req, res) => {
  const autoReply = await AutoReply.findOne({ user: req.user._id });

  if (!autoReply) {
    return res.json({ enabled: false, message: "" });
  }

  res.json(autoReply);
});

// Delete auto reply
const deleteAutoReply = asyncHandler(async (req, res) => {
  await AutoReply.findOneAndDelete({ user: req.user._id });
  res.json({ message: "Auto reply deleted" });
});

// Check and send auto reply
const checkAutoReply = async (senderId, receiverId, chatId) => {
  const autoReply = await AutoReply.findOne({
    user: receiverId,
    enabled: true,
  });

  if (!autoReply) return null;

  // Check time constraints
  const now = new Date();
  if (autoReply.startTime && now < new Date(autoReply.startTime)) return null;
  if (autoReply.endTime && now > new Date(autoReply.endTime)) return null;

  // Check if applies to this chat
  if (!autoReply.applyToAll) {
    if (!autoReply.specificChats.includes(chatId)) return null;
  }

  return autoReply.message;
};

module.exports = {
  createScheduledMessage,
  getScheduledMessages,
  cancelScheduledMessage,
  setAutoReply,
  getAutoReply,
  deleteAutoReply,
  checkAutoReply,
};
