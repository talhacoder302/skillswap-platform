const { verifyAccessToken } = require(`${__utils}/jwt`);
const responseHandler = require(`${__utils}/responseHandler`);
const User = require(`${__models}/user`);

exports.protect = async (req, res, next) => {
  try {
    let token = null;

    // 1. Try Cookie
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    // 2. Try Authorization Header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;

      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    // 3. Token Missing
    if (!token) {
      return responseHandler.unauthorized(
        res,
        "Access denied. Please login first.",
      );
    }

    // 4. Verify Token
    const decoded = verifyAccessToken(token);

    // 5. Get User
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return responseHandler.unauthorized(res, "User not found.");
    }

    if (user.isDeleted) {
      return responseHandler.unauthorized(
        res,
        "User account has been deleted.",
      );
    }

    if (!user.isActive) {
      return responseHandler.unauthorized(
        res,
        "User account has been deactivated.",
      );
    }

    // 6. Attach User
    req.user = user;

    next();
  } catch (error) {
    return responseHandler.unauthorized(res, "Invalid or expired token.");
  }
};

exports.optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next();
    }

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id).select("-password");

    if (user && user.isActive && !user.isDeleted) {
      req.user = user;
    }

    next();
  } catch (error) {
    next();
  }
};
