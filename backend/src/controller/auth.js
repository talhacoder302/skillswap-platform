const responseHandler = require(`${__utils}/responseHandler`);
const User = require(`${__models}/user`);
const generateOtp = require(`${__utils}/generateOtp`);
const OTP = require(`${__models}/otpModel`);
const { generateAccessToken, generateRefreshToken } = require(`${__utils}/jwt`);
const { logError } = require(`${__utils}/logger`);
const sendEmail = require(`${__utils}/sendEmail`);
const { getFileUrl } = require(`${__utils}/fileUploader`);

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

    // 7. Generate Tokens
    const accessToken = generateAccessToken(user);

    const refreshToken = generateRefreshToken(user);

    // 8. Save Refresh Token
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();

    await user.save();

    // 9. Remove Password & Refresh Token
    const userObj = user.toObject();

    delete userObj.password;
    delete userObj.refreshToken;

    // 10. Set Access Token Cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 Minutes
    });

    // 11. Set Refresh Token Cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
    });

    // 12. Response
    return responseHandler.success(
      res,
      {
        user: userObj,
      },
      "Login successful.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return responseHandler.error(res, "User not found");
    }

    return responseHandler.success(res, user, "User profile fetched");
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { fullName, bio, location, availability } = req.body;

    const updateData = {};

    if (fullName !== undefined) {
      if (!fullName.trim()) {
        return responseHandler.validationError(
          res,
          "Full name cannot be empty."
        );
      }

      updateData.fullName = fullName.trim();
    }

    if (bio !== undefined) {
      updateData.bio = bio.trim();
    }

    // Handle profile image upload
    if (req.file) {
      updateData.profilePicture = `${req.protocol}://${req.get("host")}/profile-images/${req.file.filename}`;
    }

    if (location !== undefined) {
      updateData.location = location.trim();
    }

    if (availability !== undefined) {
      const validAvailabilities = ["weekdays", "weekends", "both"];

      if (!validAvailabilities.includes(availability)) {
        return responseHandler.validationError(
          res,
          "Availability must be one of: weekdays, weekends, both."
        );
      }

      updateData.availability = availability;
    }

    if (Object.keys(updateData).length === 0) {
      return responseHandler.validationError(
        res,
        "No valid fields provided to update."
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password -refreshToken");

    if (!updatedUser) {
      return responseHandler.notFound(res, "User not found.");
    }

    return responseHandler.success(
      res,
      updatedUser,
      "Profile updated successfully."
    );
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

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return responseHandler.validationError(res, "Email is required.");
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return responseHandler.notFound(res, `Your email ${email} does not exist in database`);
        }

        // Generate OTP
        const otp = generateOtp();

        // Upsert OTP: update if exists, create if not (instead of creating duplicate)
        await OTP.findOneAndUpdate(
            { email: email.toLowerCase(), purpose: "forgot_password" },
            {
                email: email.toLowerCase(),
                otp,
                purpose: "forgot_password",
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
            { upsert: true, new: true }
        );

        // Send OTP via email
        try {
            await sendEmail({
                to: email.toLowerCase(),
                subject: "Password Reset OTP - SkillSwap",
                html: `<p>Your OTP for password reset is: <strong>${otp}</strong></p>
                       <p>This OTP is valid for 7 days.</p>`,
            });
        } catch (emailError) {
            logError(emailError);
            // Don't fail the request if email fails, OTP is still stored
        }

        return responseHandler.success(res, null, `OTP sent to your email ${email} for password reset`);
    } catch (error) {
        logError(error);
        return responseHandler.error(res, error);
    }
};

exports.validateAndUpdatePassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return responseHandler.validationError(res, "Email, OTP, and new password are required.");
        }

        if (newPassword.length < 6) {
            return responseHandler.validationError(res, "Password must be at least 6 characters.");
        }

        // Find OTP document
        const otpDocument = await OTP.findOne({ otp, email: email.toLowerCase(), purpose: "forgot_password" });

        if (!otpDocument) {
            return responseHandler.validationError(res, "Invalid OTP or Email");
        }

        // Check if OTP is expired based on expiresAt (7 days)
        if (new Date() > otpDocument.expiresAt) {
            await OTP.deleteOne({ _id: otpDocument._id });
            return responseHandler.validationError(res, "OTP has expired. Please request a new one.");
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return responseHandler.notFound(res, "User not found");
        }

        // Set password and save - User model's pre('save') hook will hash it automatically
        user.password = newPassword;
        await user.save();

        // Delete OTP after successful validation (auto-delete on success)
        await OTP.deleteOne({ _id: otpDocument._id });

        return responseHandler.success(res, null, "OTP verified & Password updated successfully.");
    } catch (error) {
        logError(error);
        return responseHandler.error(res, error);
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { email, currentPassword, newPassword, confirmNewPassword } = req.body;

        if (!email || !currentPassword || !newPassword || !confirmNewPassword) {
            return responseHandler.validationError(res, "All fields are required");
        }

        if (newPassword !== confirmNewPassword) {
            return responseHandler.validationError(res, "New passwords do not match");
        }

        const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
        if (!user) {
            return responseHandler.notFound(res, "User not found");
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return responseHandler.validationError(res, "Current password is incorrect");
        }

        // Set password - User model's pre('save') hook will hash it automatically
        user.password = newPassword;
        await user.save();

        return responseHandler.success(res, null, "Password changed successfully");
    } catch (error) {
        logError(error);
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

exports.resendOtp = async (req, res) => {
  try {
    return responseHandler.success(res, null, "Resend OTP API");
  } catch (error) {
    return responseHandler.error(res, error);
  }
};