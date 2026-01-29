const asyncHandler = require("express-async-handler");
const Feedback = require("../models/feedbackModel");

//@description     Submit Feedback
//@route           POST /api/feedback
//@access          Public
const submitFeedback = asyncHandler(async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        message: "Please fill all required fields",
        success: false,
      });
    }

    const feedback = await Feedback.create({
      name,
      email,
      message,
    });

    return res.status(201).json({
      message: "Thank you for your feedback! We appreciate your input.",
      success: true,
      feedback,
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Get All Feedback (Admin only)
//@route           GET /api/feedback
//@access          Protected
const getAllFeedback = asyncHandler(async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Feedbacks retrieved successfully",
      success: true,
      feedbacks,
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Delete Feedback
//@route           DELETE /api/feedback/:feedbackId
//@access          Protected
const deleteFeedback = asyncHandler(async (req, res) => {
  try {
    const { feedbackId } = req.params;

    const feedback = await Feedback.findByIdAndDelete(feedbackId);

    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Feedback deleted successfully",
      success: true,
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { submitFeedback, getAllFeedback, deleteFeedback };
