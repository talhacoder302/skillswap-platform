const mongoose = require("mongoose");
const Conversation = require(`${__models}/conversation`);
const SwapRequest = require(`${__models}/swapRequest`);
const responseHandler = require(`${__utils}/responseHandler`);
const Message = require(`${__models}/message`);
const { getPagination } = require(`${__utils}/pagination`);
const paginatedResponse = require(`${__utils}/paginatedResponse`);

exports.createConversation = async (req, res) => {
  try {
    const { swapRequestId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(swapRequestId)) {
      return responseHandler.validationError(res, "Invalid swap request id.");
    }

    const swapRequest = await SwapRequest.findOne({
      _id: swapRequestId,
      isActive: true,
    });

    if (!swapRequest) {
      return responseHandler.notFound(res, "Swap request not found.");
    }

    if (swapRequest.status !== "accepted") {
      return responseHandler.validationError(
        res,
        "Conversation can only be created for accepted swap requests.",
      );
    }

    const isParticipant =
      swapRequest.requesterId.equals(req.user._id) ||
      swapRequest.receiverId.equals(req.user._id);

    if (!isParticipant) {
      return responseHandler.forbidden(
        res,
        "You are not allowed to access this swap request.",
      );
    }

    let conversation = await Conversation.findOne({
      swapRequestId,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        swapRequestId,
        participants: [swapRequest.requesterId, swapRequest.receiverId],
      });
    }

    return responseHandler.success(res, conversation, "Conversation ready.");
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return responseHandler.validationError(res, "Invalid conversation id.");
    }

    if (!message || !message.trim()) {
      return responseHandler.validationError(res, "Message is required.");
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      isActive: true,
    });

    if (!conversation) {
      return responseHandler.notFound(res, "Conversation not found.");
    }

    const isParticipant = conversation.participants.some((id) =>
      id.equals(req.user._id),
    );

    if (!isParticipant) {
      return responseHandler.forbidden(
        res,
        "You are not a participant of this conversation.",
      );
    }

    const newMessage = await Message.create({
      conversationId,
      senderId: req.user._id,
      message: message.trim(),
      messageType: "text",
    });

    conversation.lastMessage = message.trim();
    conversation.lastMessageAt = newMessage.createdAt;

    await conversation.save();

    return responseHandler.created(
      res,
      newMessage,
      "Message sent successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
      isActive: true,
    })
      .populate({
        path: "participants",
        select: "fullName email profilePicture",
      })
      .populate({
        path: "swapRequestId",
        select: "status",
      })
      .sort({
        lastMessageAt: -1,
        createdAt: -1,
      })
      .lean();

    return responseHandler.success(
      res,
      conversations,
      "Conversations fetched successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return responseHandler.validationError(res, "Invalid conversation id.");
    }

    const { page, limit, skip } = getPagination(req.query);

    const conversation = await Conversation.findOne({
      _id: conversationId,
      isActive: true,
    });

    if (!conversation) {
      return responseHandler.notFound(res, "Conversation not found.");
    }

    const isParticipant = conversation.participants.some((id) =>
      id.equals(req.user._id),
    );

    if (!isParticipant) {
      return responseHandler.forbidden(
        res,
        "You are not allowed to access this conversation.",
      );
    }

    const filter = {
      conversationId,
      isDeleted: false,
    };

    const [messages, total] = await Promise.all([
      Message.find(filter)
        .populate({
          path: "senderId",
          select: "fullName email profilePicture",
        })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Message.countDocuments(filter),
    ]);

    return responseHandler.success(
      res,
      paginatedResponse({
        data: messages,
        total,
        page,
        limit,
      }),
      "Messages fetched successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return responseHandler.validationError(res, "Invalid conversation id.");
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      isActive: true,
    });

    if (!conversation) {
      return responseHandler.notFound(res, "Conversation not found.");
    }

    const isParticipant = conversation.participants.some((id) =>
      id.equals(req.user._id),
    );

    if (!isParticipant) {
      return responseHandler.forbidden(
        res,
        "You are not allowed to access this conversation.",
      );
    }

    const result = await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: req.user._id },
        isRead: false,
        isDeleted: false,
      },
      {
        $set: {
          isRead: true,
        },
      },
    );

    return responseHandler.success(
      res,
      {
        modifiedCount: result.modifiedCount,
      },
      "Messages marked as read successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};
