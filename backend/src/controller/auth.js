const responseHandler = require(`${__utils}/responseHandler`);
const User = require(`${__models}/user`);
const generateOtp = require(`${__utils}/generateOtp`);
const { addMinutes } = require(`${__utils}/helper`);
const OTP = require(`${__models}/otpModel`);
const { generateAccessToken } = require(`${__utils}/jwt`);

exports.register = async (req, res) => {
  try {
    // 1. Read Request
    const { fullName, email, password } = req.body;

    // 2. Validate Request
    if (!fullName || !email || !password) {
      return responseHandler.validationError(
        res,
        "Full name, email and password are required.",
      );
    }

    // 3. Existing User Check
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
      isDeleted: false,
    });

    if (existingUser) {
      return responseHandler.validationError(res, "Email already exists.");
    }

    // 4. Create User
    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      password,
    });

    // 5. Generate OTP
    const otp = generateOtp();

    // Delete previous OTP if exists
    await OTP.deleteOne({
      email: user.email,
      purpose: "verify_email",
    });

    // Save new OTP
    await OTP.create({
      email: user.email,
      otp,
      purpose: "verify_email",
    });

    // Email sending next step
    // await sendEmail({...})

    // 6. Response
    return responseHandler.created(
      res,
      {
        email: user.email,
      },
      "Registration successful. Please verify your email.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.login = async (req, res) => {
  try {
    // 1. Read Request
    const { email, password } = req.body;

    // 2. Validate
    if (!email || !password) {
      return responseHandler.validationError(
        res,
        "Email and password are required.",
      );
    }

    // 3. Find User
    const user = await User.findOne({
      email: email.toLowerCase(),
      isDeleted: false,
    }).select("+password");

    if (!user) {
      return responseHandler.validationError(res, "Invalid email or password.");
    }

    // 4. Check Verification
    if (!user.isVerified) {
      return responseHandler.validationError(
        res,
        "Please verify your email first.",
      );
    }

    // 5. Check Active
    if (!user.isActive) {
      return responseHandler.unauthorized(
        res,
        "Your account has been deactivated.",
      );
    }

    // 6. Compare Password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return responseHandler.validationError(res, "Invalid email or password.");
    }

    // 7. Generate Token
    const token = generateAccessToken({
      userId: user._id,
      role: user.role,
    });

    // 8. Update Login Time
    user.lastLogin = new Date();
    await user.save();

    // 9. Remove Password
    const userObj = user.toObject();
    delete userObj.password;

    // 10. Response
    return responseHandler.success(
      res,
      {
        user: userObj,
        accessToken: token,
      },
      "Login successful.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.getProfile = async (req, res) => {
  try {
    // const user = await User.findOne({ req.user._id })
    console.log("Requested user: ", req);
    return responseHandler.success(res, req.user, "Current User API");
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return responseHandler.validationError(
        res,
        "Email and OTP are required.",
      );
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      isDeleted: false,
    });

    if (!user) {
      return responseHandler.notFound(res, "User not found.");
    }

    if (user.isVerified) {
      return responseHandler.validationError(res, "Email is already verified.");
    }

    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      purpose: "verify_email",
    });

    if (!otpRecord) {
      return responseHandler.validationError(res, "OTP has expired.");
    }

    if (otpRecord.otp !== otp) {
      return responseHandler.validationError(res, "Invalid OTP.");
    }

    user.isVerified = true;
    await user.save();

    // Delete OTP after successful verification
    await OTP.deleteOne({
      _id: otpRecord._id,
    });

    return responseHandler.success(res, null, "Email verified successfully.");
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

exports.logout = async (req, res) => {
  try {
    return responseHandler.success(res, null, "Logout API");
  } catch (error) {
    return responseHandler.error(res, error);
  }
};
