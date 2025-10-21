import express from 'express';
import formidable from 'express-formidable';
import { isAdmin, requireSignIn } from '../middlewares/authMiddleware.js';
import {
  createProductController,
  updateProductController,
  deleteProductController,
  getProductController,
  getSingleProductController,
  productPhotoController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
  realtedProductController,
  productCategoryController,
  braintreeTokenController,
  brainTreePaymentController,
} from '../controllers/productController.js';

const router = express.Router();

// Admin routes
router.post(
  '/create-product',
  requireSignIn,
  isAdmin,
  formidable(),
  createProductController
);

router.put(
  '/update-product/:pid',
  requireSignIn,
  isAdmin,
  formidable(),
  updateProductController
);

router.delete(
  '/delete-product/:pid',
  requireSignIn,
  isAdmin,
  deleteProductController
);

// Public routes
router.get('/get-product', getProductController);
router.get('/get-product/:slug', getSingleProductController);
router.get('/product-photo/:pid', productPhotoController);
router.post('/product-filters', productFiltersController);
router.get('/product-count', productCountController);
router.get('/product-list/:page', productListController);
router.get('/search/:keyword', searchProductController);
router.get('/related-product/:pid/:cid', realtedProductController);
router.get('/product-category/:slug', productCategoryController);

// Payment routes
router.get('/braintree/token', braintreeTokenController);
router.post('/braintree/payment', requireSignIn, brainTreePaymentController);

export default router;
