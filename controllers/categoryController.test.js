import slugify from 'slugify';
import categoryModel from '../models/categoryModel';
import { normalizeText } from '../client/src/utils/textUtils';
import {
  createCategoryController,
  updateCategoryController,
} from './categoryController';

jest.mock('slugify');
jest.mock('../models/categoryModel');
jest.mock('../client/src/utils/textUtils');

describe('categoryController', () => {
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

  describe('createCategoryController', () => {
    it('creates a new category successfully', async () => {
      const name = 'Electronics';
      const slug = 'electronics';
      const category = { _id: '1', name, slug };

      req.body = { name };

      normalizeText.mockReturnValue(name);
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
      normalizeText.mockReturnValue('');

      await createCategoryController(req, res);

      expect(normalizeText).toHaveBeenCalledWith(undefined);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Name is required',
      });
    });

    it('returns 409 error when category already exists', async () => {
      const name = 'Electronics';

      req.body = { name };

      normalizeText.mockReturnValue(name);
      categoryModel.exists.mockResolvedValue({ _id: '1' });

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

    it('returns 500 error when checking for duplicate category fails', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const name = 'Electronics';

      req.body = { name };

      normalizeText.mockReturnValue(name);
      categoryModel.exists.mockRejectedValue(new Error('Database query failed'));

      await createCategoryController(req, res);

      expect(categoryModel).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to create category',
      });

      spy.mockRestore();
    });

    it('returns 500 error when saving category fails', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const name = 'Electronics';
      const slug = 'electronics';

      req.body = { name };

      normalizeText.mockReturnValue(name);
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

      spy.mockRestore();
    });
  });

  describe('updateCategoryController', () => {
    it('updates a category successfully', async () => {
      const id = '1';
      const name = 'Electronics & Gadgets';
      const slug = 'electronics-gadgets';
      const category = { _id: id, name, slug };

      req.params = { id };
      req.body = { name };

      normalizeText.mockReturnValue(name);

      categoryModel.exists
        .mockResolvedValueOnce({ _id: id }) // Category exists
        .mockResolvedValueOnce(null); // No duplicate

      slugify.mockReturnValue(slug);
      categoryModel.findByIdAndUpdate.mockResolvedValue(category);

      await updateCategoryController(req, res);

      expect(normalizeText).toHaveBeenCalledWith(name);

      expect(categoryModel.exists).toHaveBeenNthCalledWith(1, { _id: id });
      expect(categoryModel.exists).toHaveBeenNthCalledWith(2, {
        name: { $regex: `^${name}$`, $options: 'i' },
        _id: { $ne: id },
      });

      expect(slugify).toHaveBeenCalledWith(name);
      expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        { name, slug },
        { new: true },
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'Category updated successfully',
        category,
      });
    });

    it('returns 400 error when name is missing', async () => {
      req.params = { id: '1' };

      normalizeText.mockReturnValue('');

      await updateCategoryController(req, res);

      expect(normalizeText).toHaveBeenCalledWith(undefined);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Name is required',
      });
    });

    it('returns 404 error when category to update does not exist', async () => {
      const id = '1';
      const name = 'Electronics & Gadgets';

      req.params = { id };
      req.body = { name };

      normalizeText.mockReturnValue(name);
      categoryModel.exists.mockResolvedValue(null);

      await updateCategoryController(req, res);

      expect(categoryModel.exists).toHaveBeenCalledWith({ _id: id });

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Category not found',
      });
    });

    it('returns 409 error when updating to an existing name', async () => {
      const id = '1';
      const name = 'Books';

      req.params = { id };
      req.body = { name };

      normalizeText.mockReturnValue(name);

      categoryModel.exists
        .mockResolvedValueOnce({ _id: id }) // Category exists
        .mockResolvedValueOnce({ _id: '2' }); // Duplicate exists

      await updateCategoryController(req, res);

      expect(categoryModel.exists).toHaveBeenNthCalledWith(1, { _id: id });
      expect(categoryModel.exists).toHaveBeenNthCalledWith(2, {
        name: { $regex: `^${name}$`, $options: 'i' },
        _id: { $ne: id },
      });

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Category already exists',
      });
    });

    it('returns 500 error when checking if category exists fails', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const id = '1';
      const name = 'Electronics & Gadgets';

      req.params = { id };
      req.body = { name };

      normalizeText.mockReturnValue(name);
      categoryModel.exists.mockRejectedValue(new Error('Database query failed'));

      await updateCategoryController(req, res);

      expect(categoryModel.findByIdAndUpdate).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update category',
      });

      spy.mockRestore();
    });

    it('returns 500 error when checking for duplicate category fails', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const id = '1';
      const name = 'Electronics & Gadgets';

      req.params = { id };
      req.body = { name };

      normalizeText.mockReturnValue(name);

      categoryModel.exists
        .mockResolvedValueOnce({ _id: id }) // Category exists
        .mockRejectedValueOnce(new Error('Database query failed')); // Duplicate check fails

      await updateCategoryController(req, res);

      expect(categoryModel.findByIdAndUpdate).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update category',
      });

      spy.mockRestore();
    });

    it('returns 500 error when updating category fails', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const id = '1';
      const name = 'Electronics & Gadgets';
      const slug = 'electronics-gadgets';

      req.params = { id };
      req.body = { name };

      normalizeText.mockReturnValue(name);

      categoryModel.exists
        .mockResolvedValueOnce({ _id: id }) // Category exists
        .mockResolvedValueOnce(null); // No duplicate

      slugify.mockReturnValue(slug);
      categoryModel.findByIdAndUpdate.mockRejectedValue(new Error('Database update failed'));

      await updateCategoryController(req, res);

      expect(categoryModel.findByIdAndUpdate).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update category',
      });

      spy.mockRestore();
    });
  });
});
