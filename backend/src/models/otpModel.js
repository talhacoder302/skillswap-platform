const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    otp: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      enum: ["verify_email", "forgot_password"],
      required: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // 10 minutes
    },
  },
  {
    versionKey: false,
  },
);

module.exports = mongoose.model("OTP", otpSchema);
