const responseHandler = require(`${__utils}/responseHandler`);

exports.checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return responseHandler.unauthorized(res, "Unauthorized access.");
    }

    if (!roles.includes(req.user.role)) {
      return responseHandler.unauthorized(
        res,
        "You are not authorized to access this resource.",
      );
    }

    next();
  };
};
