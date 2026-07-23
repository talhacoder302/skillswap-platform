const mongoose = require("mongoose");
const UserSkill = require(`${__models}/userSkill`);
const Skill = require(`${__models}/skill`);
const responseHandler = require(`${__utils}/responseHandler`);

exports.addUserSkill = async (req, res) => {
  try {
    const { skillId, type, proficiency, description } = req.body;

    // Required Fields
    if (!skillId || !type) {
      return responseHandler.validationError(
        res,
        "Skill and type are required.",
      );
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(skillId)) {
      return responseHandler.validationError(res, "Invalid skill id.");
    }

    // Validate Type
    if (!["offered", "wanted"].includes(type)) {
      return responseHandler.validationError(res, "Invalid skill type.");
    }

    // Check Skill
    const skill = await Skill.findOne({
      _id: skillId,
      isActive: true,
    });

    if (!skill) {
      return responseHandler.notFound(res, "Skill not found.");
    }

    // Duplicate Check
    const alreadyExists = await UserSkill.findOne({
      userId: req.user._id,
      skillId,
      type,
      isActive: true,
    });

    if (alreadyExists) {
      return responseHandler.validationError(
        res,
        `Skill already added in ${type} list.`,
      );
    }

    // Create User Skill
    const userSkill = await UserSkill.create({
      userId: req.user._id,
      skillId,
      type,
      proficiency: proficiency || "Beginner",
      description: description || "",
    });

    return responseHandler.created(res, userSkill, "Skill added successfully.");
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.getMySkills = async (req, res) => {
  try {
    const { type } = req.query;

    const filter = {
      userId: req.user._id,
      isActive: true,
    };

    if (type) {
      if (!["offered", "wanted"].includes(type)) {
        return responseHandler.validationError(res, "Invalid skill type.");
      }

      filter.type = type;
    }

    const skills = await UserSkill.find(filter)
      .select("-__v")
      .populate({
        path: "skillId",
        select: "name slug categoryId",
        populate: {
          path: "categoryId",
          select: "name slug",
        },
      })
      .sort({ createdAt: -1 });

    return responseHandler.success(
      res,
      skills,
      "User skills fetched successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.updateUserSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const { skillId, type, proficiency, description } = req.body;

    // Validate User Skill Id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return responseHandler.validationError(res, "Invalid user skill id.");
    }

    // Required Fields
    if (!skillId || !type) {
      return responseHandler.validationError(
        res,
        "Skill and type are required.",
      );
    }

    // Validate Skill Id
    if (!mongoose.Types.ObjectId.isValid(skillId)) {
      return responseHandler.validationError(res, "Invalid skill id.");
    }

    // Validate Type
    if (!["offered", "wanted"].includes(type)) {
      return responseHandler.validationError(res, "Invalid skill type.");
    }

    // Validate Proficiency
    const allowedLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];

    if (proficiency && !allowedLevels.includes(proficiency)) {
      return responseHandler.validationError(res, "Invalid proficiency level.");
    }

    // Find User Skill
    const userSkill = await UserSkill.findOne({
      _id: id,
      userId: req.user._id,
      isActive: true,
    });

    if (!userSkill) {
      return responseHandler.notFound(res, "User skill not found.");
    }

    // Check Skill Exists
    if (userSkill.skillId.toString() !== skillId) {
      const skill = await Skill.findOne({
        _id: skillId,
        isActive: true,
      });

      if (!skill) {
        return responseHandler.notFound(res, "Skill not found.");
      }
    }

    // Duplicate Check
    const duplicate = await UserSkill.findOne({
      _id: { $ne: id },
      userId: req.user._id,
      skillId,
      type,
      isActive: true,
    });

    if (duplicate) {
      return responseHandler.validationError(
        res,
        `Skill already exists in ${type} list.`,
      );
    }

    // Update
    userSkill.skillId = skillId;
    userSkill.type = type;
    userSkill.proficiency = proficiency || "Beginner";
    userSkill.description = description || "";

    await userSkill.save();

    return responseHandler.success(
      res,
      userSkill,
      "User skill updated successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.deleteUserSkill = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return responseHandler.validationError(res, "Invalid user skill id.");
    }

    // Find User Skill
    const userSkill = await UserSkill.findOne({
      _id: id,
      userId: req.user._id,
      isActive: true,
    });

    if (!userSkill) {
      return responseHandler.notFound(res, "User skill not found.");
    }

    // Soft Delete
    userSkill.isActive = false;

    await userSkill.save();

    return responseHandler.success(
      res,
      null,
      "User skill removed successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};
