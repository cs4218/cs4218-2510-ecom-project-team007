import slugify from 'slugify';
import categoryModel from '../models/categoryModel.js';
import { createCategoryController } from './categoryController';

jest.mock('slugify');
jest.mock('../models/categoryModel.js');

describe('categoryController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
    }

    res = {
      status: jest.fn().mockReturnThis(),
      send:  jest.fn(),
    }
  });

  describe('createCategoryController', () => {
    it('creates a new category successfully', async () => {
      const name = 'Electronics';
      const slug = 'electronics';
      const category = { _id: '1', name, slug };

      req.body = { name };

      categoryModel.exists.mockResolvedValue(null);
      slugify.mockReturnValue(slug);

      const mockSave = jest.fn().mockResolvedValue(category);
      categoryModel.mockImplementation(() => ({ save: mockSave }));

      await createCategoryController(req, res);

      expect(categoryModel.exists).toHaveBeenCalledWith({ name });

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

    it.each([
      ['is missing', undefined],
      ['is empty', ''],
      ['contains only whitespace', '   '],
    ])('returns 400 error when name %s', async (description, name) => {
      if (name !== undefined) {
        req.body = { name };
      }

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Name is required',
      });
    });

    it('returns 409 error when category already exists', async () => {
      const name = 'Electronics';
      req.body = { name };

      categoryModel.exists.mockResolvedValue({ _id: '1' });

      await createCategoryController(req, res);

      expect(categoryModel.exists).toHaveBeenCalledWith({ name });
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Category already exists',
      });
    });

    it('returns 500 error when checking for duplicate category fails', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

      req.body = { name: 'Electronics' };

      categoryModel.exists.mockRejectedValue(new Error('Database query failed'));

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to create category',
      });

      spy.mockRestore();
    });

    it('returns 500 error when saving category fails', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

      req.body = { name: 'Electronics' };

      categoryModel.exists.mockResolvedValue(null);
      slugify.mockReturnValue('electronics');

      categoryModel.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Database save failed')),
      }));

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to create category',
      });

      spy.mockRestore();
    });
  });
});
