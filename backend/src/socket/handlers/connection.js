const { addUser, removeUser } = require("../utils/onlineUsers");

module.exports = (io, socket) => {
  const userId = socket.user._id.toString();

  addUser(userId, socket.id);

  console.log(`${socket.user.fullName} connected (${socket.id})`);

  socket.on("disconnect", () => {
    removeUser(userId, socket.id);

    console.log(`${socket.user.fullName} disconnected (${socket.id})`);
  });
};
