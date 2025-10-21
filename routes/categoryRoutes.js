import express from 'express';
import { isAdmin, requireSignIn } from '../middlewares/authMiddleware.js';
import {
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
  categoryControlller,
  singleCategoryController,
} from '../controllers/categoryController.js';

const router = express.Router();

// Admin routes
router.post(
  '/create-category',
  requireSignIn,
  isAdmin,
  createCategoryController
);

router.put(
  '/update-category/:id',
  requireSignIn,
  isAdmin,
  updateCategoryController
);

router.delete(
  '/delete-category/:id',
  requireSignIn,
  isAdmin,
  deleteCategoryController
);

// Public routes
router.get('/get-category', categoryControlller);
router.get('/single-category/:slug', singleCategoryController);

export default router;
