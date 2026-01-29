const express = require("express");
const {
  submitFeedback,
  getAllFeedback,
  deleteFeedback,
} = require("../controllers/feedbackControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Submit feedback (public route)
router.post("/", submitFeedback);

// Get all feedbacks (protected - admin only)
router.get("/", protect, getAllFeedback);

// Delete feedback (protected - admin only)
router.delete("/:feedbackId", protect, deleteFeedback);

module.exports = router;
