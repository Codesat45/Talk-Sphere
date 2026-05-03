const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const cloudinary = require("../utils/cloudinary");

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({
      chat: req.params.chatId,
      deletedFor: { $ne: req.user._id }, // hide messages deleted for this user
    })
      .populate("sender", "name pic email")
      .populate({
        path: "replyTo",
        select: "content messageType sender",
        populate: { path: "sender", select: "name" },
      })
      .populate("reactions.user", "name pic")
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId, messageType = "text", mediaUrl, replyTo } = req.body;

  if ((!content && !mediaUrl) || !chatId) {
    // console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
    messageType,
    mediaUrl,
    replyTo,
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic");
    message = await message.populate({
      path: "replyTo",
      select: "content messageType sender",
      populate: { path: "sender", select: "name" },
    });
    message = await message.populate("chat");
    message = await message.populate("reactions.user", "name pic");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message,
    });

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Delete Message
//@route           DELETE /api/message/:messageId
//@access          Protected
const deleteMessage = asyncHandler(async (req, res) => {
  try {
    const { messageId } = req.params;

    // Find message first
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
        success: false,
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        message: "You can only delete your own messages",
        success: false,
      });
    }

    // Delete the message
    await Message.findByIdAndDelete(messageId);

    return res.status(200).json({
      message: "Message deleted successfully",
      success: true,
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const editMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({
      message: "Message content is required",
      success: false,
    });
  }

  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({
      message: "Message not found",
      success: false,
    });
  }

  if (message.sender.toString() !== req.user._id.toString()) {
    return res.status(401).json({
      message: "You can only edit your own messages",
      success: false,
    });
  }

  message.content = content.trim();
  message.isEdited = true;
  await message.save();

  const updatedMessage = await Message.findById(message._id)
    .populate("sender", "name pic email")
    .populate({
      path: "replyTo",
      select: "content messageType sender",
      populate: { path: "sender", select: "name" },
    })
    .populate("reactions.user", "name pic")
    .populate("chat");

  res.json(updatedMessage);
});

const reactToMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;

  if (!emoji) {
    return res.status(400).json({
      message: "Emoji is required",
      success: false,
    });
  }

  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({
      message: "Message not found",
      success: false,
    });
  }

  const existingReaction = message.reactions.find(
    (reaction) => reaction.user.toString() === req.user._id.toString()
  );

  if (existingReaction) {
    if (existingReaction.emoji === emoji) {
      message.reactions = message.reactions.filter(
        (reaction) => reaction.user.toString() !== req.user._id.toString()
      );
    } else {
      existingReaction.emoji = emoji;
    }
  } else {
    message.reactions.push({ user: req.user._id, emoji });
  }

  await message.save();

  const updatedMessage = await Message.findById(message._id)
    .populate("sender", "name pic email")
    .populate({
      path: "replyTo",
      select: "content messageType sender",
      populate: { path: "sender", select: "name" },
    })
    .populate("reactions.user", "name pic")
    .populate("chat");

  res.json(updatedMessage);
});

//@description     Delete a message only for the requesting user (hide from their view)
//@route           PUT /api/message/:messageId/delete-for-me
//@access          Protected
const deleteMessageForMe = asyncHandler(async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found", success: false });
    }

    if (!message.deletedFor.includes(req.user._id)) {
      message.deletedFor.push(req.user._id);
      await message.save();
    }

    return res.status(200).json({ message: "Message hidden for you", success: true });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Delete entire chat for the requesting user only
//@route           DELETE /api/message/chat/:chatId/delete-for-me
//@access          Protected
const deleteChatForMe = asyncHandler(async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found", success: false });
    }

    if (!chat.users.some((u) => u.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "You are not part of this chat", success: false });
    }

    // Mark all messages in this chat as deleted for this user
    await Message.updateMany(
      { chat: chatId, deletedFor: { $ne: req.user._id } },
      { $push: { deletedFor: req.user._id } }
    );

    return res.status(200).json({ message: "Chat deleted for you", success: true, chatId });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Upload media file (image/video/document) to cloudinary
//@route           POST /api/message/upload
//@access          Protected
const uploadMedia = asyncHandler(async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded", success: false });
    }

    // Upload to cloudinary with resource_type auto (handles images, videos, raw files)
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: "auto",
      folder: "talk-sphere-media",
    });

    return res.status(200).json({
      message: "File uploaded successfully",
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = {
  allMessages,
  sendMessage,
  deleteMessage,
  editMessage,
  reactToMessage,
  deleteMessageForMe,
  deleteChatForMe,
  uploadMedia,
};
