import slugify from 'slugify';
import categoryModel from '../models/categoryModel';
import productModel from '../models/productModel';
import { normalizeText } from '../client/src/utils/textUtils';
import {
  createCategoryController,
  updateCategoryController,
  deleteCategoryController
} from './categoryController';

jest.mock('slugify');
jest.mock('../models/categoryModel');
jest.mock('../models/productModel');

jest.mock('../client/src/utils/textUtils', () => ({
  normalizeText: jest.fn(text => text),
}));

describe('categoryController', () => {
  const id = '1';

  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: {},
      body: {},
    }

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createCategoryController', () => {
    const name = 'Electronics';
    const slug = 'electronics';

    beforeEach(() => {
      req.body = { name };
    });

    it('creates a new category successfully', async () => {
      const category = { _id: id, name, slug };

      categoryModel.exists.mockResolvedValue(null);
      slugify.mockReturnValue(slug);

      const mockSave = jest.fn().mockResolvedValue(category);
      categoryModel.mockImplementation(() => ({ save: mockSave }));

      await createCategoryController(req, res);

      expect(normalizeText).toHaveBeenCalledWith(name);

      expect(categoryModel.exists).toHaveBeenCalledWith({
        name: { $regex: `^${name}$`, $options: 'i' },
      });

      expect(slugify).toHaveBeenCalledWith(name);
      expect(categoryModel).toHaveBeenCalledWith({ name, slug });
      expect(mockSave).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'New category created',
        category,
      });
    });

    it('returns 400 error when name is missing', async () => {
      req.body = {};

      normalizeText.mockReturnValueOnce('');

      await createCategoryController(req, res);

      expect(normalizeText).toHaveBeenCalledWith(undefined);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Name is required',
      });
    });

    it('returns 409 error when category already exists', async () => {
      categoryModel.exists.mockResolvedValue({ _id: id });

      await createCategoryController(req, res);

      expect(categoryModel.exists).toHaveBeenCalledWith({
        name: { $regex: `^${name}$`, $options: 'i' },
      });

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Category already exists',
      });
    });

    it('returns 500 error when checking for conflicting name fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      categoryModel.exists.mockRejectedValue(new Error('Database query failed'));

      await createCategoryController(req, res);

      expect(categoryModel).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to create category',
      });
    });

    it('returns 500 error when saving category fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      categoryModel.exists.mockResolvedValue(null);
      slugify.mockReturnValue(slug);

      const mockSave = jest.fn().mockRejectedValue(new Error('Database save failed'));
      categoryModel.mockImplementation(() => ({ save: mockSave }));

      await createCategoryController(req, res);

      expect(mockSave).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to create category',
      });
    });
  });

  describe('updateCategoryController', () => {
    const updatedName = 'Electronics & Gadgets';
    const updatedSlug = 'electronics-gadgets';

    beforeEach(() => {
      req.params = { id };
      req.body = { name: updatedName };
    });

    it('updates a category successfully', async () => {
      const updatedCategory = { _id: id, name: updatedName, slug: updatedSlug };

      categoryModel.exists
        .mockResolvedValueOnce({ _id: id }) // Category exists
        .mockResolvedValueOnce(null); // No conflict

      slugify.mockReturnValue(updatedSlug);
      categoryModel.findByIdAndUpdate.mockResolvedValue(updatedCategory);

      await updateCategoryController(req, res);

      expect(normalizeText).toHaveBeenCalledWith(updatedName);

      expect(categoryModel.exists).toHaveBeenNthCalledWith(1, { _id: id });
      expect(categoryModel.exists).toHaveBeenNthCalledWith(2, {
        name: { $regex: `^${updatedName}$`, $options: 'i' },
        _id: { $ne: id },
      });

      expect(slugify).toHaveBeenCalledWith(updatedName);
      expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        { name: updatedName, slug: updatedSlug },
        { new: true },
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'Category updated successfully',
        category: updatedCategory,
      });
    });

    it('returns 400 error when name is missing', async () => {
      req.body = {};

      normalizeText.mockReturnValueOnce('');

      await updateCategoryController(req, res);

      expect(normalizeText).toHaveBeenCalledWith(undefined);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Name is required',
      });
    });

    it('returns 404 error when category to update does not exist', async () => {
      categoryModel.exists.mockResolvedValue(null);

      await updateCategoryController(req, res);

      expect(categoryModel.exists).toHaveBeenCalledWith({ _id: id });

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Category not found',
      });
    });

    it('returns 409 error when the updated name already exists', async () => {
      const conflictingName = 'Books';

      req.body = { name: conflictingName };

      categoryModel.exists
        .mockResolvedValueOnce({ _id: id }) // Category exists
        .mockResolvedValueOnce({ _id: '2' }); // Conflict exists

      await updateCategoryController(req, res);

      expect(categoryModel.exists).toHaveBeenNthCalledWith(1, { _id: id });
      expect(categoryModel.exists).toHaveBeenNthCalledWith(2, {
        name: { $regex: `^${conflictingName}$`, $options: 'i' },
        _id: { $ne: id },
      });

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Category already exists',
      });
    });

    it('returns 500 error when checking if category to update exists fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      categoryModel.exists.mockRejectedValue(new Error('Database query failed'));

      await updateCategoryController(req, res);

      expect(categoryModel.findByIdAndUpdate).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update category',
      });
    });

    it('returns 500 error when checking for conflicting name fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      categoryModel.exists
        .mockResolvedValueOnce({ _id: id }) // Category exists
        .mockRejectedValueOnce(new Error('Database query failed')); // Conflict check fails

      await updateCategoryController(req, res);

      expect(categoryModel.findByIdAndUpdate).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update category',
      });
    });

    it('returns 500 error when updating category fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      categoryModel.exists
        .mockResolvedValueOnce({ _id: id }) // Category exists
        .mockResolvedValueOnce(null); // No conflict

      slugify.mockReturnValue(updatedSlug);
      categoryModel.findByIdAndUpdate.mockRejectedValue(new Error('Database update failed'));

      await updateCategoryController(req, res);

      expect(categoryModel.findByIdAndUpdate).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update category',
      });
    });
  });

  describe('deleteCategoryController', () => {
    beforeEach(() => {
      req.params = { id };
    });

    it('deletes a category successfully', async () => {
      categoryModel.exists.mockResolvedValue({ _id: id });
      productModel.exists.mockResolvedValue(null);
      categoryModel.findByIdAndDelete.mockResolvedValue();

      await deleteCategoryController(req, res);

      expect(categoryModel.exists).toHaveBeenCalledWith({ _id: id });
      expect(productModel.exists).toHaveBeenCalledWith({ category: id });
      expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith(id);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'Category deleted successfully',
      });
    });

    it('returns 404 error when category to delete does not exist', async () => {
      categoryModel.exists.mockResolvedValue(null);

      await deleteCategoryController(req, res);

      expect(categoryModel.exists).toHaveBeenCalledWith({ _id: id });

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Category not found',
      });
    });

    it('returns 409 error when category still has products', async () => {
      categoryModel.exists.mockResolvedValue({ _id: id });
      productModel.exists.mockResolvedValue({ _id: '1' });

      await deleteCategoryController(req, res);

      expect(categoryModel.exists).toHaveBeenCalledWith({ _id: id });
      expect(productModel.exists).toHaveBeenCalledWith({ category: id });

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Category still has products',
      });
    });

    it('returns 500 error when checking if category to delete exists fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      categoryModel.exists.mockRejectedValue(new Error('Database query failed'));

      await deleteCategoryController(req, res);

      expect(categoryModel.findByIdAndDelete).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to delete category',
      });
    });

    it('returns 500 error when checking if category has products fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      categoryModel.exists.mockResolvedValue({ _id: id });
      productModel.exists.mockRejectedValue(new Error('Database query failed'));

      await deleteCategoryController(req, res);

      expect(categoryModel.findByIdAndDelete).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to delete category',
      });
    });

    it('returns 500 error when deleting category fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      categoryModel.exists.mockResolvedValue({ _id: id });
      productModel.exists.mockResolvedValue(null);
      categoryModel.findByIdAndDelete.mockRejectedValue(new Error('Database delete failed'));

      await deleteCategoryController(req, res);

      expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith(id);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to delete category',
      });
    });
  });
});
