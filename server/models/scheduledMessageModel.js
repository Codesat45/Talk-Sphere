const mongoose = require("mongoose");

const scheduledMessageSchema = mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    scheduledTime: {
      type: Date,
      required: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    mediaUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "cancelled"],
      default: "pending",
    },
    sentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const ScheduledMessage = mongoose.model("ScheduledMessage", scheduledMessageSchema);

module.exports = ScheduledMessage;
