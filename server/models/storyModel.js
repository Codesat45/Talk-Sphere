const mongoose = require("mongoose");

const storyModel = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true },
    mediaUrl: { type: String, trim: true },
    background: { type: String, default: "#16a34a" },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: { expires: 0 },
    },
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  }
);

const Story = mongoose.model("Story", storyModel);

module.exports = Story;
