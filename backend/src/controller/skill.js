const mongoose = require("mongoose");
const Skill = require(`${__models}/skill`);
const SkillCategory = require(`${__models}/skillCategory`);
const responseHandler = require(`${__utils}/responseHandler`);
const slugify = require(`${__utils}/slugify`);
const { getPagination } = require(`${__utils}/pagination`);
const paginatedResponse = require(`${__utils}/paginatedResponse`);

exports.createSkill = async (req, res) => {
  try {
    const { name, categoryId, description } = req.body;

    // Validation
    if (!name || !categoryId) {
      return responseHandler.validationError(
        res,
        "Skill name and category are required.",
      );
    }

    // Validate Category Id
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return responseHandler.validationError(res, "Invalid category id.");
    }

    // Check Category
    const category = await SkillCategory.findOne({
      _id: categoryId,
      isActive: true,
    });

    if (!category) {
      return responseHandler.notFound(res, "Category not found.");
    }

    const skillName = name.trim();
    const slug = slugify(skillName);

    // Duplicate Check
    const existingSkill = await Skill.findOne({
      slug,
    });

    if (existingSkill) {
      return responseHandler.validationError(res, "Skill already exists.");
    }

    // Create Skill
    const skill = await Skill.create({
      name: skillName,
      slug,
      categoryId,
      description,
      createdBy: req.user._id,
    });

    return responseHandler.created(res, skill, "Skill created successfully.");
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.getSkills = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const { search, categoryId, sort = "-createdAt" } = req.query;

    const filter = {
      isActive: true,
    };

    if (search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
    }

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    const [skills, total] = await Promise.all([
      Skill.find(filter)
        .populate({
          path: "categoryId",
          select: "name slug",
        })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),

      Skill.countDocuments(filter),
    ]);

    return responseHandler.success(
      res,
      paginatedResponse({
        data: skills,
        total,
        page,
        limit,
      }),
      "Skills fetched successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.getSkillById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return responseHandler.validationError(res, "Invalid skill id.");
    }

    // Find Skill
    const skill = await Skill.findOne({
      _id: id,
      isActive: true,
    }).populate("categoryId", "name slug");

    if (!skill) {
      return responseHandler.notFound(res, "Skill not found.");
    }

    return responseHandler.success(res, skill, "Skill fetched successfully.");
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.updateSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, categoryId, description } = req.body;

    // Validate Skill Id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return responseHandler.validationError(res, "Invalid skill id.");
    }

    // Validate Required Fields
    if (!name || !categoryId) {
      return responseHandler.validationError(
        res,
        "Skill name and category are required.",
      );
    }

    // Validate Category Id
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return responseHandler.validationError(res, "Invalid category id.");
    }

    // Find Skill
    const skill = await Skill.findOne({
      _id: id,
      isActive: true,
    });

    if (!skill) {
      return responseHandler.notFound(res, "Skill not found.");
    }

    console.log(categoryId);
    console.log(typeof categoryId);
    console.log(await SkillCategory.find());

    // Check Category
    const category = await SkillCategory.findOne({
      _id: categoryId,
      isActive: true,
    });

    if (!category) {
      return responseHandler.notFound(res, "Category not found.");
    }

    // Duplicate Check
    const slug = slugify(name);

    const existingSkill = await Skill.findOne({
      _id: { $ne: id },
      slug,
    });

    if (existingSkill) {
      return responseHandler.validationError(res, "Skill already exists.");
    }

    // Update Skill
    skill.name = name.trim();
    skill.slug = slug;
    skill.categoryId = categoryId;
    skill.description = description || "";
    skill.updatedBy = req.user._id;

    await skill.save();

    return responseHandler.success(res, skill, "Skill updated successfully.");
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.deleteSkill = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return responseHandler.validationError(res, "Invalid skill id.");
    }

    // Find Skill
    const skill = await Skill.findOne({
      _id: id,
      isActive: true,
    });

    if (!skill) {
      return responseHandler.notFound(res, "Skill not found.");
    }

    // Soft Delete
    skill.isActive = false;
    skill.updatedBy = req.user._id;

    await skill.save();

    return responseHandler.success(res, null, "Skill deleted successfully.");
  } catch (error) {
    return responseHandler.error(res, error);
  }
};
