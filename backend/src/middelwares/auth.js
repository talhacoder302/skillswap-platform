const { verifyAccessToken } = require(`${__utils}/jwt`);
const responseHandler = require(`${__utils}/responseHandler`);
const User = require(`${__models}/user`);

exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return responseHandler.unauthorized(
        res,
        "Access denied. No token provided.",
      );
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user || user.isDeleted || !user.isActive) {
      return responseHandler.unauthorized(
        res,
        "User not found or account is inactive.",
      );
    }

    req.user = user;

    next();
  } catch (error) {
    return responseHandler.unauthorized(res, "Invalid or expired token.");
  }
};
