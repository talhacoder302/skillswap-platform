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
      const { error, conversation } = await validateConversation(
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
    } catch (error) {
      console.error(error);

      socket.emit("chat:error", {
        message: "Unable to send message.",
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
        return socket.emit("chat:error", {
          message: error,
        });
      }

      await Message.updateMany(
        {
          conversationId,
          senderId: {
            $ne: socket.user._id,
          },
          isRead: false,
          isDeleted: false,
        },
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          },
        },
      );

      io.to(conversationId).emit("chat:read", {
        conversationId,
        readerId: socket.user._id,
        readAt: new Date(),
      });
    } catch (error) {
      console.error(error);

      socket.emit("chat:error", {
        message: "Unable to mark messages as read.",
      });
    }
  });

  /**
   * Typing Start
   */
  socket.on("chat:typing", async ({ conversationId }) => {
    try {
      const { error } = await validateConversation(
        conversationId,
        socket.user._id,
      );

      if (error) return;

      socket.to(conversationId).emit("chat:typing", {
        conversationId,
        userId: socket.user._id,
        fullName: socket.user.fullName,
      });
    } catch (error) {
      console.error(error);
    }
  });

  /**
   * Typing Stop
   */
  socket.on("chat:stop-typing", async ({ conversationId }) => {
    try {
      const { error } = await validateConversation(
        conversationId,
        socket.user._id,
      );

      if (error) return;

      socket.to(conversationId).emit("chat:stop-typing", {
        conversationId,
        userId: socket.user._id,
      });
    } catch (error) {
      console.error(error);
    }
  });
};
