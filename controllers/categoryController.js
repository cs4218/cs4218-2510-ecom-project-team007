import slugify from 'slugify';
import categoryModel from '../models/categoryModel.js';
import { normalizeText } from '../client/src/utils/textUtils.js';

export const createCategoryController = async (req, res) => {
  try {
    const name = normalizeText(req.body.name);
    if (!name) {
      return res.status(400).send({
        success: false,
        message: 'Name is required',
      });
    }

    // Check for duplicate name
    const duplicateExists = await categoryModel.exists({
      name: { $regex: `^${name}$`, $options: 'i' }, // Case-insensitive
    });

    if (duplicateExists) {
      return res.status(409).send({
        success: false,
        message: 'Category already exists',
      });
    }

    const category = await new categoryModel({
      name,
      slug: slugify(name),
    }).save();

    res.status(201).send({
      success: true,
      message: 'New category created',
      category,
    });
  } catch (error) {
    console.error('Error creating category:', error.message);
    res.status(500).send({
      success: false,
      message: 'Failed to create category',
    });
  }
};

export const updateCategoryController = async (req, res) => {
  try {
    const { id } = req.params;
    const name = normalizeText(req.body.name);

    if (!name) {
      return res.status(400).send({
        success: false,
        message: 'Name is required',
      });
    }

    // Check if category to update exists
    const categoryExists = await categoryModel.exists({ _id: id });
    if (!categoryExists) {
      return res.status(404).send({
        success: false,
        message: 'Category not found',
      });
    }

    // Check for duplicate name
    const duplicateExists = await categoryModel.exists({
      name: { $regex: `^${name}$`, $options: 'i' }, // Case-insensitive
      _id: { $ne: id }, // Excludes current category
    });

    if (duplicateExists) {
      return res.status(409).send({
        success: false,
        message: 'Category already exists',
      });
    }

    const category = await categoryModel.findByIdAndUpdate(
      id,
      { name, slug: slugify(name) },
      { new: true },
    );

    res.status(200).send({
      success: true,
      message: 'Category updated successfully',
      category,
    });
  } catch (error) {
    console.error('Error updating category:', error.message);
    res.status(500).send({
      success: false,
      message: 'Failed to update category',
    });
  }
};

// Get all categories
export const categoryControlller = async (req, res) => {
  try {
    const category = await categoryModel.find({});
    res.status(200).send({
      success: true,
      message: 'All Categories List',
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: 'Error while getting all categories',
    });
  }
};

// Get a single category
export const singleCategoryController = async (req, res) => {
  try {
    const category = await categoryModel.findOne({ slug: req.params.slug });
    res.status(200).send({
      success: true,
      message: 'Get SIngle Category SUccessfully',
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: 'Error While getting Single Category',
    });
  }
};

export const deleteCategoryCOntroller = async (req, res) => {
  try {
    const { id } = req.params;
    await categoryModel.findByIdAndDelete(id);
    res.status(200).send({
      success: true,
      message: 'Categry Deleted Successfully',
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: 'error while deleting category',
      error,
    });
  }
};
