const mongoose = require("mongoose");

const Conversation = require(`${__models}/conversation`);
const Message = require(`${__models}/message`);

const validateConversation = async (conversationId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return {
      error: "Invalid conversation id.",
    };
  }

  const conversation = await Conversation.findOne({
    _id: conversationId,
    isActive: true,
  });

  if (!conversation) {
    return {
      error: "Conversation not found.",
    };
  }

  const isParticipant = conversation.participants.some((id) =>
    id.equals(userId),
  );

  if (!isParticipant) {
    return {
      error: "Access denied.",
    };
  }

  return { conversation };
};

module.exports = (io, socket) => {
  /**
   * Join Conversation
   */
  socket.on("chat:join", async ({ conversationId }) => {
    try {
      const { error } = await validateConversation(
        conversationId,
        socket.user._id,
      );

      if (error) {
        return socket.emit("chat:error", {
          message: error,
        });
      }

      socket.join(conversationId);

      socket.emit("chat:joined", {
        conversationId,
      });

      console.log(`[Socket] ${socket.user.fullName} joined ${conversationId}`);
    } catch (error) {
      console.error(error);

      socket.emit("chat:error", {
        message: "Unable to join conversation.",
      });
    }
  });

  /**
   * Send Message
   */
  socket.on("chat:send", async ({ conversationId, message }) => {
    try {
      const { error, conversation } = await validateConversation(
        conversationId,
        socket.user._id,
      );

      if (error) {
        return socket.emit("chat:error", {
          message: error,
        });
      }

      if (!message?.trim()) {
        return socket.emit("chat:error", {
          message: "Message is required.",
        });
      }

      const newMessage = await Message.create({
        conversationId,
        senderId: socket.user._id,
        message: message.trim(),
        messageType: "text",
      });

      conversation.lastMessage = message.trim();
      conversation.lastMessageAt = newMessage.createdAt;

      await conversation.save();

      const populatedMessage = await Message.findById(newMessage._id)
        .populate("senderId", "fullName email profilePicture")
        .lean();

      io.to(conversationId).emit("chat:receive", populatedMessage);

      // 🔥 Realtime conversation update
      io.to(conversationId).emit("conversation:update", {
        conversationId: conversation._id,
        lastMessage: populatedMessage.message,
        lastMessageAt: populatedMessage.createdAt,
        updatedAt: conversation.updatedAt,
      });
    } catch (error) {
      console.error(error);

      socket.emit("chat:error", {
        message: "Unable to send message.",
      });
    }
  });

/**
 * Edit Message
 */
socket.on("chat:edit", async ({ messageId, message }) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return socket.emit("chat:error", {
        message: "Invalid message id.",
      });
    }

    if (!message?.trim()) {
      return socket.emit("chat:error", {
        message: "Message is required.",
      });
    }

    const existingMessage = await Message.findOne({
      _id: messageId,
      isDeleted: false,
    });

    if (!existingMessage) {
      return socket.emit("chat:error", {
        message: "Message not found.",
      });
    }

    if (!existingMessage.senderId.equals(socket.user._id)) {
      return socket.emit("chat:error", {
        message: "You can edit only your own messages.",
      });
    }

    existingMessage.message = message.trim();
    existingMessage.isEdited = true;
    existingMessage.editedAt = new Date();

    await existingMessage.save();

    const populatedMessage = await Message.findById(existingMessage._id)
      .populate("senderId", "fullName email profilePicture")
      .lean();

    io.to(existingMessage.conversationId.toString()).emit(
      "chat:edited",
      populatedMessage,
    );

    // Update conversation if this is the latest message
    const latestMessage = await Message.findOne({
      conversationId: existingMessage.conversationId,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    if (latestMessage && latestMessage._id.equals(existingMessage._id)) {
      await Conversation.findByIdAndUpdate(existingMessage.conversationId, {
        lastMessage: latestMessage.message,
        lastMessageAt: latestMessage.createdAt,
      });

      io.to(existingMessage.conversationId.toString()).emit(
        "conversation:update",
        {
          conversationId: existingMessage.conversationId,
          lastMessage: latestMessage.message,
          lastMessageAt: latestMessage.createdAt,
        },
      );
    }
  } catch (error) {
    console.error(error);

    socket.emit("chat:error", {
      message: "Unable to edit message.",
    });
  }
});

/**
 * Delete Message
 */
socket.on("chat:delete", async ({ messageId }) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return socket.emit("chat:error", {
        message: "Invalid message id.",
      });
    }

    const existingMessage = await Message.findOne({
      _id: messageId,
      isDeleted: false,
    });

    if (!existingMessage) {
      return socket.emit("chat:error", {
        message: "Message not found.",
      });
    }

    if (!existingMessage.senderId.equals(socket.user._id)) {
      return socket.emit("chat:error", {
        message: "You can delete only your own messages.",
      });
    }

    existingMessage.isDeleted = true;
    existingMessage.deletedAt = new Date();
    existingMessage.message = "This message was deleted.";

    await existingMessage.save();

    // Notify room that message was deleted
    io.to(existingMessage.conversationId.toString()).emit("chat:deleted", {
      messageId: existingMessage._id,
      conversationId: existingMessage.conversationId,
      deletedAt: existingMessage.deletedAt,
    });

    // Find latest non-deleted message
    const latestMessage = await Message.findOne({
      conversationId: existingMessage.conversationId,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    let lastMessage = "";
    let lastMessageAt = null;

    if (latestMessage) {
      lastMessage = latestMessage.message;
      lastMessageAt = latestMessage.createdAt;
    }

    await Conversation.findByIdAndUpdate(existingMessage.conversationId, {
      lastMessage,
      lastMessageAt,
    });

    // Notify sidebar update
    io.to(existingMessage.conversationId.toString()).emit(
      "conversation:update",
      {
        conversationId: existingMessage.conversationId,
        lastMessage,
        lastMessageAt,
      },
    );
  } catch (error) {
    console.error(error);

    socket.emit("chat:error", {
      message: "Unable to delete message.",
    });
  }
});

  /**
   * Read Messages
   */
  socket.on("chat:read", async ({ conversationId }) => {
    try {
      const { error } = await validateConversation(
        conversationId,
        socket.user._id,
      );

      if (error) {
        return;
      }

      const readAt = new Date();

      await Message.updateMany(
        {
          conversationId,
          senderId: { $ne: socket.user._id },
          isRead: false,
          isDeleted: false,
        },
        {
          $set: {
            isRead: true,
            readAt,
          },
        },
      );

      io.to(conversationId).emit("chat:read", {
        conversationId,
        readerId: socket.user._id,
        readAt,
      });
    } catch (error) {
      console.error(error);
    }
  });

  /**
   * Typing
   */
  socket.on("chat:typing", async ({ conversationId }) => {
    socket.to(conversationId).emit("chat:typing", {
      conversationId,
      userId: socket.user._id,
      fullName: socket.user.fullName,
    });
  });

  socket.on("chat:stop-typing", async ({ conversationId }) => {
    socket.to(conversationId).emit("chat:stop-typing", {
      conversationId,
      userId: socket.user._id,
    });
  });
};;
