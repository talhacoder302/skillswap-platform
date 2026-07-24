const mongoose = require("mongoose");
const UserSkill = require(`${__models}/userSkill`);
const Skill = require(`${__models}/skill`);
const responseHandler = require(`${__utils}/responseHandler`);
const { getPagination } = require(`${__utils}/pagination`);
const paginatedResponse = require(`${__utils}/paginatedResponse`);

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
    const { page, limit, skip } = getPagination(req.query);

    const {
      type,
      proficiency,
      search,
      categoryId,
      sort = "-createdAt",
    } = req.query;

    const match = {
      userId: req.user._id,
      isActive: true,
    };

    if (type) {
      match.type = type;
    }

    if (proficiency) {
      match.proficiency = proficiency;
    }

    const skillMatch = {};

    if (search) {
      skillMatch.name = {
        $regex: search,
        $options: "i",
      };
    }

    if (categoryId) {
      skillMatch.categoryId = new mongoose.Types.ObjectId(categoryId);
    }

    const sortObj = {};

    if (sort.startsWith("-")) {
      sortObj[sort.substring(1)] = -1;
    } else {
      sortObj[sort] = 1;
    }

    const pipeline = [
      {
        $match: match,
      },
      {
        $lookup: {
          from: "skills",
          localField: "skillId",
          foreignField: "_id",
          as: "skillId",
          pipeline: [
            {
              $match: skillMatch,
            },
            {
              $lookup: {
                from: "skillcategories",
                localField: "categoryId",
                foreignField: "_id",
                as: "categoryId",
              },
            },
            {
              $unwind: {
                path: "$categoryId",
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
        },
      },
      {
        $unwind: "$skillId",
      },
      {
        $sort: sortObj,
      },
      {
        $facet: {
          data: [
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },
          ],
          total: [
            {
              $count: "count",
            },
          ],
        },
      },
    ];

    const result = await UserSkill.aggregate(pipeline);

    const skills = result[0].data;

    const total = result[0].total.length > 0 ? result[0].total[0].count : 0;

    return responseHandler.success(
      res,
      paginatedResponse({
        data: skills,
        total,
        page,
        limit,
      }),
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
