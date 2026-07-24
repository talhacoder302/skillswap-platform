const onlineUsers = new Map();

const addUser = (userId, socketId) => {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }

  onlineUsers.get(userId).add(socketId);
};

const removeUser = (userId, socketId) => {
  if (!onlineUsers.has(userId)) {
    return;
  }

  const sockets = onlineUsers.get(userId);

  sockets.delete(socketId);

  if (sockets.size === 0) {
    onlineUsers.delete(userId);
  }
};

const isOnline = (userId) => {
  return onlineUsers.has(userId);
};

const getUserSockets = (userId) => {
  return [...(onlineUsers.get(userId) || [])];
};

const getOnlineUsers = () => {
  return [...onlineUsers.keys()];
};

module.exports = {
  addUser,
  removeUser,
  isOnline,
  getUserSockets,
  getOnlineUsers,
};
