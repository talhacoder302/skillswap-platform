const SkillCategory = require(`${__models}/skillCategory`);
const responseHandler = require(`${__utils}/responseHandler`);
const slugify = require(`${__utils}/slugify`);
const mongoose = require("mongoose");

exports.createCategory = async (req, res) => {
  try {
    // 1. Read Request
    const { name, description } = req.body;

    // 2. Validation
    if (!name) {
      return responseHandler.validationError(res, "Category name is required.");
    }

    // 3. Normalize
    const categoryName = name.trim();

    // 4. Check Duplicate
    const existingCategory = await SkillCategory.findOne({
      name: {
        $regex: new RegExp(`^${categoryName}$`, "i"),
      },
    });

    if (existingCategory) {
      return responseHandler.validationError(res, "Category already exists.");
    }

    // 5. Create
    const category = await SkillCategory.create({
      name: categoryName,
      slug: slugify(categoryName),
      description,
      createdBy: req.user._id,
    });

    // 6. Response
    return responseHandler.created(
      res,
      category,
      "Category created successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await SkillCategory.find({
      isActive: true,
    })
      .sort({ name: 1 })
      .select("-__v");

    return responseHandler.success(
      res,
      categories,
      "Categories fetched successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    // 1. Get Params
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return responseHandler.validationError(res, "Invalid category id.");
    }

    // 2. Find Category
    const category = await SkillCategory.findOne({
      _id: id,
      isActive: true,
    });

    // 3. Not Found
    if (!category) {
      return responseHandler.notFound(res, "Category not found.");
    }

    // 4. Response
    return responseHandler.success(
      res,
      category,
      "Category fetched successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return responseHandler.validationError(res, "Invalid category id.");
    }

    // Validate Name
    if (!name) {
      return responseHandler.validationError(res, "Category name is required.");
    }

    // Find Category
    const category = await SkillCategory.findOne({
      _id: id,
      isActive: true,
    });

    if (!category) {
      return responseHandler.notFound(res, "Category not found.");
    }

    // Duplicate Check
    const slug = slugify(name);

    const existingCategory = await SkillCategory.findOne({
      _id: { $ne: id },
      slug,
    });

    if (existingCategory) {
      return responseHandler.validationError(res, "Category already exists.");
    }

    // Update
    category.name = name.trim();
    category.slug = slugify(name);
    category.description = description || "";
    category.updatedBy = req.user._id;

    await category.save();

    return responseHandler.success(
      res,
      category,
      "Category updated successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return responseHandler.validationError(res, "Invalid category id.");
    }

    // Find Category
    const category = await SkillCategory.findOne({
      _id: id,
      isActive: true,
    });

    if (!category) {
      return responseHandler.notFound(res, "Category not found.");
    }

    // Soft Delete
    category.isActive = false;
    category.updatedBy = req.user._id;

    await category.save();

    return responseHandler.success(res, null, "Category deleted successfully.");
  } catch (error) {
    return responseHandler.error(res, error);
  }
};
