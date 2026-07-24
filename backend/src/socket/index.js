const authMiddleware = require("./middleware/auth");

const connectionHandler = require("./handlers/connection");
const chatHandler = require("./handlers/chat");
const presenceHandler = require("./handlers/presence");

module.exports = (io) => {
  io.use(authMiddleware);

  io.on("connection", (socket) => {
    connectionHandler(io, socket);
    chatHandler(io, socket);
    presenceHandler(io, socket);
  });
};
