const asyncHandler = require("express-async-handler");
const Story = require("../models/storyModel");

const getStories = asyncHandler(async (req, res) => {
  const stories = await Story.find({ expiresAt: { $gt: new Date() } })
    .populate("user", "name pic")
    .populate("viewers", "name pic")
    .sort({ createdAt: -1 });

  res.json(stories);
});

const createStory = asyncHandler(async (req, res) => {
  const { text, mediaUrl, background } = req.body;

  if (!text && !mediaUrl) {
    return res.status(400).json({
      message: "Story text or media URL is required",
      success: false,
    });
  }

  let story = await Story.create({
    user: req.user._id,
    text,
    mediaUrl,
    background,
  });

  story = await story.populate("user", "name pic");

  res.status(201).json({
    story,
    message: "Story added",
    success: true,
  });
});

const viewStory = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.storyId);

  if (!story) {
    return res.status(404).json({
      message: "Story not found",
      success: false,
    });
  }

  if (!story.viewers.some((viewer) => viewer.toString() === req.user._id.toString())) {
    story.viewers.push(req.user._id);
    await story.save();
  }

  const updatedStory = await Story.findById(story._id)
    .populate("user", "name pic")
    .populate("viewers", "name pic");

  res.json(updatedStory);
});

const deleteStory = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.storyId);

  if (!story) {
    return res.status(404).json({
      message: "Story not found",
      success: false,
    });
  }

  if (story.user.toString() !== req.user._id.toString()) {
    return res.status(401).json({
      message: "You can only delete your own story",
      success: false,
    });
  }

  await Story.findByIdAndDelete(story._id);

  res.json({
    message: "Story deleted",
    success: true,
  });
});

module.exports = {
  getStories,
  createStory,
  viewStory,
  deleteStory,
};
