const express = require("express");
const {
  getStories,
  createStory,
  viewStory,
  deleteStory,
} = require("../controllers/storyControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, getStories).post(protect, createStory);
router.route("/:storyId/view").put(protect, viewStory);
router.route("/:storyId").delete(protect, deleteStory);

module.exports = router;
