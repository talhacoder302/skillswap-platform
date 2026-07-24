const mongoose = require("mongoose");

const Conversation = require(`${__models}/conversation`);
const Message = require(`${__models}/message`);

module.exports = (io, socket) => {
  socket.on("chat:join", async ({ conversationId }) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return socket.emit("chat:error", {
          message: "Invalid conversation id.",
        });
      }

      const conversation = await Conversation.findOne({
        _id: conversationId,
        isActive: true,
      });

      if (!conversation) {
        return socket.emit("chat:error", {
          message: "Conversation not found.",
        });
      }

      const isParticipant = conversation.participants.some((id) =>
        id.equals(socket.user._id),
      );

      if (!isParticipant) {
        return socket.emit("chat:error", {
          message: "Access denied.",
        });
      }

      socket.join(conversationId);

      socket.emit("chat:joined", {
        conversationId,
      });

      console.log(
        `[Socket] ${socket.user.fullName} joined conversation ${conversationId}`,
      );
    } catch (error) {
      console.error(error);

      socket.emit("chat:error", {
        message: "Unable to join conversation.",
      });
    }
  });

  socket.on("chat:send", async ({ conversationId, message }) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return socket.emit("chat:error", {
          message: "Invalid conversation id.",
        });
      }

      if (!message?.trim()) {
        return socket.emit("chat:error", {
          message: "Message is required.",
        });
      }

      const conversation = await Conversation.findOne({
        _id: conversationId,
        isActive: true,
      });

      if (!conversation) {
        return socket.emit("chat:error", {
          message: "Conversation not found.",
        });
      }

      const isParticipant = conversation.participants.some((id) =>
        id.equals(socket.user._id),
      );

      if (!isParticipant) {
        return socket.emit("chat:error", {
          message: "Access denied.",
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
};
