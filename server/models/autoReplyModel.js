const mongoose = require("mongoose");

const autoReplySchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    message: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    applyToAll: {
      type: Boolean,
      default: true,
    },
    specificChats: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const AutoReply = mongoose.model("AutoReply", autoReplySchema);

module.exports = AutoReply;
