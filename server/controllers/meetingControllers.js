const asyncHandler = require("express-async-handler");
const Meeting = require("../models/meetingModel");
const User = require("../models/userModel");
const { sendMeetingInvitation, sendMeetingUpdate } = require("../utils/emailService");
const { createNotification } = require("../controllers/notificationControllers");

// Create a new meeting
const createMeeting = asyncHandler(async (req, res) => {
  const { title, description, participants, scheduledTime, duration, meetingType, recordingUrl, presentationUrl } = req.body;

  if (!title || !scheduledTime) {
    return res.status(400).json({ message: "Title and scheduled time are required" });
  }

  if (participants && participants.length > 50) {
    return res.status(400).json({ message: "Maximum 50 participants allowed" });
  }

  const meeting = await Meeting.create({
    title,
    description,
    organizer: req.user._id,
    participants: participants || [],
    scheduledTime,
    duration: duration || 60,
    meetingType: meetingType || "video",
    recordingUrl,
    presentationUrl,
    meetingLink: `${process.env.CLIENT_URL}/meeting/${Date.now()}`,
  });

  const populatedMeeting = await Meeting.findById(meeting._id)
    .populate("organizer", "name pic email")
    .populate("participants", "name pic email");

  // Send email invitations to all participants
  try {
    if (populatedMeeting.participants.length > 0) {
      await sendMeetingInvitation(populatedMeeting, populatedMeeting.participants);
      
      // Create in-app notifications
      for (const participant of populatedMeeting.participants) {
        await createNotification(
          participant._id,
          "meeting_invitation",
          `Meeting Invitation: ${populatedMeeting.title}`,
          `${populatedMeeting.organizer.name} invited you to a meeting on ${new Date(populatedMeeting.scheduledTime).toLocaleString()}`,
          populatedMeeting._id,
          populatedMeeting.meetingLink
        );
      }
      
      console.log("Meeting invitations sent successfully");
    }
  } catch (emailError) {
    console.error("Failed to send email invitations:", emailError);
    // Don't fail the meeting creation if email fails
  }

  res.status(201).json(populatedMeeting);
});

// Get all meetings for a user
const getUserMeetings = asyncHandler(async (req, res) => {
  const meetings = await Meeting.find({
    $or: [
      { organizer: req.user._id },
      { participants: req.user._id }
    ]
  })
    .populate("organizer", "name pic email")
    .populate("participants", "name pic email")
    .sort({ scheduledTime: 1 });

  res.json(meetings);
});

// Get meeting by ID
const getMeetingById = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findById(req.params.id)
    .populate("organizer", "name pic email")
    .populate("participants", "name pic email");

  if (!meeting) {
    return res.status(404).json({ message: "Meeting not found" });
  }

  res.json(meeting);
});

// Update meeting
const updateMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findById(req.params.id);

  if (!meeting) {
    return res.status(404).json({ message: "Meeting not found" });
  }

  if (meeting.organizer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Only organizer can update meeting" });
  }

  const updatedMeeting = await Meeting.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  )
    .populate("organizer", "name pic email")
    .populate("participants", "name pic email");

  // Send update notification to participants
  try {
    if (updatedMeeting.participants.length > 0) {
      await sendMeetingUpdate(updatedMeeting, updatedMeeting.participants, "updated");
    }
  } catch (emailError) {
    console.error("Failed to send update emails:", emailError);
  }

  res.json(updatedMeeting);
});

// Delete meeting
const deleteMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findById(req.params.id)
    .populate("organizer", "name pic email")
    .populate("participants", "name pic email");

  if (!meeting) {
    return res.status(404).json({ message: "Meeting not found" });
  }

  if (meeting.organizer._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Only organizer can delete meeting" });
  }

  // Send cancellation notification to participants
  try {
    if (meeting.participants.length > 0) {
      await sendMeetingUpdate(meeting, meeting.participants, "cancelled");
    }
  } catch (emailError) {
    console.error("Failed to send cancellation emails:", emailError);
  }

  await Meeting.findByIdAndDelete(req.params.id);

  res.json({ message: "Meeting deleted successfully" });
});

// Upload meeting recording/presentation
const uploadMeetingFile = asyncHandler(async (req, res) => {
  const { meetingId, fileUrl, fileType } = req.body;

  const meeting = await Meeting.findById(meetingId);

  if (!meeting) {
    return res.status(404).json({ message: "Meeting not found" });
  }

  if (fileType === "recording") {
    meeting.recordingUrl = fileUrl;
  } else if (fileType === "presentation") {
    meeting.presentationUrl = fileUrl;
  }

  await meeting.save();

  res.json(meeting);
});

module.exports = {
  createMeeting,
  getUserMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  uploadMeetingFile,
};
