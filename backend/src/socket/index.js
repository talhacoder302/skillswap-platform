const authMiddleware = require("./middleware/auth");

const connectionHandler = require("./handlers/connection");
const chatHandler = require("./handlers/chat");
const presenceHandler = require("./handlers/presence");

let ioInstance = null;

const initializeSocket = (io) => {
  ioInstance = io;

  io.use(authMiddleware);

  io.on("connection", (socket) => {
    connectionHandler(io, socket);
    chatHandler(io, socket);
    presenceHandler(io, socket);
  });
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.io has not been initialized.");
  }

  return ioInstance;
};

module.exports = {
  initializeSocket,
  getIO,
};