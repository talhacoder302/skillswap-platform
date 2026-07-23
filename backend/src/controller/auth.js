const responseHandler = require(`${__utils}/responseHandler`);

exports.register = async (req, res) => {
  try {
    return responseHandler.success(res, null, "Register API");
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.login = async (req, res) => {
  try {
    return responseHandler.success(res, null, "Login API");
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    return responseHandler.success(res, null, "Verify Email API");
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.resendOtp = async (req, res) => {
  try {
    return responseHandler.success(res, null, "Resend OTP API");
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    return responseHandler.success(res, null, "Forgot Password API");
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    return responseHandler.success(res, null, "Reset Password API");
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.me = async (req, res) => {
  try {
    return responseHandler.success(res, null, "Current User API");
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.logout = async (req, res) => {
  try {
    return responseHandler.success(res, null, "Logout API");
  } catch (error) {
    return responseHandler.error(res, error);
  }
};
