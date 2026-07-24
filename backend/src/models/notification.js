const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    swapRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SwapRequest",
      default: null,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "swap_request_sent",
        "swap_request_accepted",
        "swap_request_rejected",
        "swap_request_cancelled",
        "swap_request_completed",
      ],
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Indexes
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ swapRequestId: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
