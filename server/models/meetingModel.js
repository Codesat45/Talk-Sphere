const mongoose = require("mongoose");

const meetingSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    scheduledTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // in minutes
      default: 60,
    },
    meetingType: {
      type: String,
      enum: ["video", "audio"],
      default: "video",
    },
    recordingUrl: {
      type: String,
    },
    presentationUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
    },
    meetingLink: {
      type: String,
    },
    reminders: [
      {
        time: Date,
        sent: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Meeting = mongoose.model("Meeting", meetingSchema);

module.exports = Meeting;
