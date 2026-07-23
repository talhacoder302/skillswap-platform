const mongoose = require("mongoose");

const userSkillSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
      required: true,
    },

    type: {
      type: String,
      enum: ["offered", "wanted"],
      required: true,
    },

    proficiency: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
      default: "Beginner",
    },

    description: {
      type: String,
      default: "",
      trim: true,
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

// Prevent duplicate skill for same user and type
userSkillSchema.index(
  {
    userId: 1,
    skillId: 1,
    type: 1,
  },
  {
    unique: true,
  },
);

// Performance indexes
userSkillSchema.index({ userId: 1 });
userSkillSchema.index({ skillId: 1 });

module.exports = mongoose.model("UserSkill", userSkillSchema);
