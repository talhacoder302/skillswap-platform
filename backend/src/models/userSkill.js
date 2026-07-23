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

    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Expert"],
      required: true,
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

// ✅ Performance Indexes
userSkillSchema.index({ userId: 1 });
userSkillSchema.index({ skillId: 1 });

// ✅ Prevent Duplicate Skills
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

module.exports = mongoose.model("UserSkill", userSkillSchema);
