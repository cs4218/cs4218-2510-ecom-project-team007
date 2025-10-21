import fs from 'fs';
import braintree from 'braintree';
import dotenv from 'dotenv';
import slugify from 'slugify';
import categoryModel from '../models/categoryModel.js';
import orderModel from '../models/orderModel.js';
import productModel from '../models/productModel.js';
import { productSchema } from '../client/src/schemas/productSchema.js';
import { validateProductPhoto } from '../client/src/utils/photoValidation.js';

dotenv.config();

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

export const createProductController = async (req, res) => {
  const { name } = req.fields;
  const { photo } = req.files;

  try {
    await productSchema.validate(req.fields);
  } catch (error) {
    return res.status(400).send({
      success: false,
      message: error.errors[0],
    });
  }

  if (photo) {
    const error = validateProductPhoto(photo);
    if (error) {
      return res.status(400).send({
        success: false,
        message: error,
      });
    }
  }

  try {
    const nameExists = await productModel.exists({
      name: { $regex: `^${name}$`, $options: 'i' }, // Case-insensitive
    });

    if (nameExists) {
      return res.status(409).send({
        success: false,
        message: 'Product name already exists',
      });
    }

    const product = new productModel({
      ...req.fields,
      slug: slugify(name),
    });

    if (photo) {
      product.photo.data = fs.readFileSync(photo.path);
      product.photo.contentType = photo.type;
    }

    await product.save();

    res.status(201).send({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    console.error('Error creating product:', error.message);
    res.status(500).send({
      success: false,
      message: 'Failed to create product',
    });
  }
};

export const updateProductController = async (req, res) => {
  const { pid } = req.params;
  const { name } = req.fields;
  const { photo } = req.files;

  try {
    await productSchema.validate(req.fields);
  } catch (error) {
    return res.status(400).send({
      success: false,
      message: error.errors[0],
    });
  }

  if (photo) {
    const error = validateProductPhoto(photo);
    if (error) {
      return res.status(400).send({
        success: false,
        message: error,
      });
    }
  }

  try {
    const product = await productModel.findById(pid);
    if (!product) {
      return res.status(404).send({
        success: false,
        message: 'Product not found',
      });
    }

    const nameExists = await productModel.exists({
      name: { $regex: `^${name}$`, $options: 'i' }, // Case-insensitive
      _id: { $ne: pid }, // Excludes current product
    });

    if (nameExists) {
      return res.status(409).send({
        success: false,
        message: 'Product name already exists',
      });
    }

    Object.assign(product, req.fields);
    product.slug = slugify(name);

    if (photo) {
      product.photo.data = fs.readFileSync(photo.path);
      product.photo.contentType = photo.type;
    }

    await product.save();

    res.status(200).send({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    console.error('Error updating product:', error.message);
    res.status(500).send({
      success: false,
      message: 'Failed to update product',
    });
  }
};

export const deleteProductController = async (req, res) => {
  const { pid } = req.params;

  try {
    const productExists = await productModel.exists({ _id: pid });
    if (!productExists) {
      return res.status(404).send({
        success: false,
        message: 'Product not found',
      });
    }

    await productModel.findByIdAndDelete(pid);

    res.status(200).send({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error.message);
    res.status(500).send({
      success: false,
      message: 'Failed to delete product',
    });
  }
};

//get all products
export const getProductController = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .populate("category")
      .select("-photo.data")
      .sort({ createdAt: -1 });

    res.status(200).send({
      success: true,
      countTotal: products.length,
      message: "All products fetched",
      products,
    });

  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting products",
      error: error.message,
    });
  }
};

// get single product from its slug
export const getSingleProductController = async (req, res) => {
  try {
    if (!req.params)
      return res.status(400).send({
        success: false,
        message: "Missing parameter in request"
      });

    const product = await productModel
      .findOne({ slug: req.params.slug })
      .select("-photo.data")
      .populate("category");

    if (!product) {
      return res.status(404).send({
        success: false,
        message: "No matching product found"
      });
    }

    res.status(200).send({
      success: true,
      message: "Single product fetched",
      product,
    });

  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting single product",
      error: error.message,
    });
  }
};

// get photo
export const productPhotoController = async (req, res) => {
  try {
    if (!req.params)
      return res.status(400).send({
        success: false,
        message: "Missing parameter in request"
      });

    const product = await productModel.findById(req.params.pid).select("photo");

    if (!product || !product.photo || !product.photo.data) {
      return res.status(404).send({
        success: false,
        message: "Photo not found",
      });
    }
    
    res.set("Content-type", product.photo.contentType);
    return res.status(200).send(product.photo.data);

  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting photo",
      error: error.message,
    });
  }
};

// filters with pagination support
export const productFiltersController = async (req, res) => {
  try {
    const { checked, radio, page = 1 } = req.body;

    if (radio !== undefined && (!Array.isArray(radio) || ![0,2].includes(radio.length)))
      return res.status(400).send({
        success: false,
        message: "Invalid radio field"
      }); 

    let args = {};
    if (checked && checked.length > 0) args.category = checked;
    if (radio && radio.length === 2) args.price = { $gte: radio[0], $lte: radio[1] };

    const perPage = 6;
    const total = await productModel.countDocuments(args);  // total count of filtered products

    const products = await productModel
      .find(args)
      .select("-photo.data")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });
    
    res.status(200).send({
      success: true,
      products,
      total,
      page,
      pages: Math.ceil(total / perPage)
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while filtering products",
      error: error.message,
    });
  }
};

// product count
export const productCountController = async (req, res) => {
  try {
    const total = await productModel.find({}).estimatedDocumentCount();
    res.status(200).send({
      success: true,
      total,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in product count",
      error: error.message
    });
  }
};

// product list base on page
export const productListController = async (req, res) => {
  try {
    if (!req.params)
      return res.status(400).send({
        success: false,
        message: "Missing parameter in request"
      });
 
    const perPage = 6;
    const page = req.params.page ? req.params.page : 1;

    if (page < 0)
      return res.status(400).send({
        success: false,
        message: "Invalid 'page' parameter in request"
      });

    const products = await productModel
      .find({})
      .select("-photo.data")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });

    res.status(200).send({
      success: true,
      products
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in product list",
      error: error.message,
    });
  }
};

// search product
export const searchProductController = async (req, res) => {
  try {
    const { keyword } = req.params;
    const resutls = await productModel
      .find({
        $or: [
          { name: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
        ],
      })
    res.json(resutls);
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error In Search Product API",
      error,
    });
  }
};

// similar products
export const realtedProductController = async (req, res) => {
  try {
    const { pid, cid } = req.params;
    const products = await productModel
      .find({
        category: cid,
        _id: { $ne: pid },
      })
      .select("-photo.data")
      .limit(3)
      .populate("category");
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "error while geting related product",
      error,
    });
  }
};

// get product by category
export const productCategoryController = async (req, res) => {
  try {
    if (!req.params || !req.params.slug)
      return res.status(400).send({
        success: false,
        message: "Missing request parameter for category slug"
      });

    const category = await categoryModel.findOne({ slug: req.params.slug });
    if (!category)
      return res.status(404).send({
        success: false,
        message: "Requested category not found"
      });

    const products = await productModel.find({ category })
                        .populate("category")
                        .select("-photo.data");

    res.status(200).send({ success: true, category, products });

  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting products via category",
      error: error.message,
    });
  }
};

//payment gateway api
//token
export const braintreeTokenController = async (req, res) => {
  try {
    gateway.clientToken.generate({}, function (err, response) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.send(response);
      }
    });
  } catch (error) {
    console.log(error);
  }
};

//payment
export const brainTreePaymentController = async (req, res) => {
  try {
    const { nonce, cart } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).send('Cart is required');
    }
    let total = 0;
    for (const item of cart) {
      if (typeof item.price !== 'number' || isNaN(item.price)) {
        return res.status(400).send('Invalid price');
      }
      total += item.price;
    }
    if (!req.user || !req.user._id) {
      return res.status(500).send('User not logged in');
    }
    let newTransaction = gateway.transaction.sale(
      {
        amount: total,
        paymentMethodNonce: nonce,
        options: {
          submitForSettlement: true,
        },
      },
      function (error, result) {
        if (result) {
          const order = new orderModel({
            products: cart,
            payment: result,
            buyer: req.user._id,
          }).save();
          res.json({ ok: true });
        } else {
          res.status(500).send(error);
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};
