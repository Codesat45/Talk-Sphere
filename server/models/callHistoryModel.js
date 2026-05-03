const mongoose = require("mongoose");

const callHistorySchema = mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    callType: {
      type: String,
      enum: ["audio", "video"],
      required: true,
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["completed", "missed", "rejected", "failed"],
      default: "completed",
    },
  },
  {
    timestamps: true,
  }
);

const CallHistory = mongoose.model("CallHistory", callHistorySchema);

module.exports = CallHistory;
