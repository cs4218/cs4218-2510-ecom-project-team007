import slugify from 'slugify';
import categoryModel from '../models/categoryModel';
import productModel from '../models/productModel';
import { normalizeText } from '../client/src/utils/textUtils';
import {
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
  categoryControlller,
  singleCategoryController,
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
        message: 'Category created successfully',
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

    it('returns 409 error when the category already exists', async () => {
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

    it('returns 500 error when checking for existing name fails', async () => {
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
        .mockResolvedValueOnce(null); // Name doesn't exist

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

    it('returns 409 error when the category name already exists', async () => {
      const existingName = 'Books';

      req.body = { name: existingName };

      categoryModel.exists
        .mockResolvedValueOnce({ _id: id }) // Category exists
        .mockResolvedValueOnce({ _id: '2' }); // Name already exists

      await updateCategoryController(req, res);

      expect(categoryModel.exists).toHaveBeenCalledWith({
        name: { $regex: `^${existingName}$`, $options: 'i' },
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

      expect(categoryModel.exists).toHaveBeenCalledTimes(1);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update category',
      });
    });

    it('returns 500 error when checking for existing name fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      categoryModel.exists
        .mockResolvedValueOnce({ _id: id }) // Category exists
        .mockRejectedValueOnce(new Error('Database query failed')); // Name check fails

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
        .mockResolvedValueOnce({ _id: id })
        .mockResolvedValueOnce(null);

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

      expect(productModel.exists).not.toHaveBeenCalled();

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

  // --- Category Controller ---
  describe('categoryControlller', () => {
    let req, res;

    beforeEach(() => {
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      jest.clearAllMocks();
    });

    it('returns all categories with 200 status when there is at least one category', async () => {
      const mockCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' },
        { _id: '2', name: 'Books', slug: 'books' },
      ];
      categoryModel.find.mockResolvedValue(mockCategories);

      await categoryControlller(req, res);

      expect(categoryModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'All Categories List',
        category: mockCategories,
      });
    });

    it('returns empty array with 200 status when there are no categories', async () => {
      const mockCategories = []
      categoryModel.find.mockResolvedValue(mockCategories);

      await categoryControlller(req, res);

      expect(categoryModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'All Categories List',
        category: mockCategories,
      });
    });

    it('returns 500 error status when database query fails', async () => {
      const mockError = new Error('Database error');
      categoryModel.find.mockRejectedValue(mockError);

      await categoryControlller(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: mockError,
        message: 'Error while getting all categories',
      });
    });

    it('logs error to console when database query fails', async () => {
      const mockError = new Error('Database error');
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      categoryModel.find.mockRejectedValue(mockError);

      await categoryControlller(req, res);

      expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
      consoleLogSpy.mockRestore();
    });
  });

  // --- Single Category Controller ---
  describe('singleCategoryController', () => {
    let req, res;

    beforeEach(() => {
      req = {
        params: { slug: 'electronics' },
      };
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      jest.clearAllMocks();
    });

    it('uses slug from request params', async () => {
      req.params.slug = 'books';
      categoryModel.findOne.mockResolvedValue({});

      await singleCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: 'books' });
    });

    it('returns single category by slug with 200 status', async () => {
      const mockCategory = { _id: '1', name: 'Electronics', slug: 'electronics' };
      categoryModel.findOne.mockResolvedValue(mockCategory);

      await singleCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: 'electronics' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'Get single category successfully',
        category: mockCategory,
      });
    });

    it('returns null category when slug does not match any category', async () => {
      categoryModel.findOne.mockResolvedValue(null);

      await singleCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'Get single category successfully',
        category: null,
      });
    });

    it('returns 500 status when database query fails', async () => {
      const mockError = new Error('Database error');
      categoryModel.findOne.mockRejectedValue(mockError);

      await singleCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: mockError,
        message: 'Error while getting single category',
      });
    });

    it('logs error to console when database query fails', async () => {
      const mockError = new Error('Database error');
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      categoryModel.findOne.mockRejectedValue(mockError);

      await singleCategoryController(req, res);

      expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
      consoleLogSpy.mockRestore();
    });
  });
});
