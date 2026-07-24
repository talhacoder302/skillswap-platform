const mongoose = require("mongoose");

const swapRequestSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    requesterSkillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserSkill",
      required: true,
    },

    receiverSkillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserSkill",
      required: true,
    },

    message: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "completed"],
      default: "pending",
    },

    completedAt: {
      type: Date,
      default: null,
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

// Prevent duplicate pending request
swapRequestSchema.index({
  requesterId: 1,
  receiverId: 1,
  requesterSkillId: 1,
  receiverSkillId: 1,
  status: 1,
});

// Performance Indexes
swapRequestSchema.index({ requesterId: 1 });
swapRequestSchema.index({ receiverId: 1 });
swapRequestSchema.index({ status: 1 });

module.exports = mongoose.model("SwapRequest", swapRequestSchema);
