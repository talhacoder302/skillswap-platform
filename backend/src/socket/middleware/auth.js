const { verifyAccessToken } = require(`${__utils}/jwt`);
const User = require(`${__models}/user`);

module.exports = async (socket, next) => {
  try {
    let token = socket.handshake.auth?.token;

    if (!token) {
      const authHeader = socket.handshake.headers.authorization;

      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return next(new Error("Authentication required."));
    }

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new Error("User not found."));
    }

    if (!user.isActive || user.isDeleted) {
      return next(new Error("User is inactive."));
    }

    socket.user = user;

    next();
  } catch (error) {
    next(new Error("Invalid or expired token."));
  }
};
