const User = require(`${__models}/user`);

const {
  addUser,
  removeUser,
  getOnlineUsers,
  isOnline,
} = require("../utils/onlineUsers");

module.exports = (io, socket) => {
  const userId = socket.user._id.toString();

  addUser(userId, socket.id);

  console.log(`${socket.user.fullName} connected (${socket.id})`);

  io.emit("presence:online", {
    userId,
  });

  io.emit("presence:users", {
    users: getOnlineUsers(),
  });

  socket.on("disconnect", async () => {
    try {
      removeUser(userId, socket.id);

      if (!isOnline(userId)) {
        const lastSeen = new Date();

        await User.findByIdAndUpdate(userId, {
          lastSeen,
        });

        io.emit("presence:offline", {
          userId,
          lastSeen,
        });
      }

      io.emit("presence:users", {
        users: getOnlineUsers(),
      });

      console.log(`${socket.user.fullName} disconnected (${socket.id})`);
    } catch (error) {
      console.error(error);
    }
  });
};
