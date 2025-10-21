import fs from "fs";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import productModel from "../models/productModel";
import categoryModel from "../models/categoryModel";
import {
  getProductController,
  getSingleProductController,
  productPhotoController,
  productFiltersController,
  productCountController,
  productListController,
  productCategoryController,
} from '../controllers/productController';

const categories = [];
const products = [];
let mongoServer, req, res;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Load 3 test categories into categoryModel
  for (let i = 1; i <= 3; i++) {
    categories.push(await categoryModel({
                      name: "Category " + i,
                      slug: "category" + i,
                    }).save());
  }

  // Prepare 20 products for testing (yet to be added)
  for (let i = 1; i <= 20; i++) {
    products.push({
      name: "Product " + i,
      slug: "Product-" + i,
      description: "product " + i,
      price: 1,
      category: categories[0]._id,
      quantity: 2,
      shipping: true,
      photo: {
        data: Buffer.from("sample buffered photo"),
        contentType: "image/jpeg"
      }
    });
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Test getProductController with mongoose", () => {
  beforeEach(async () => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    await productModel.deleteMany({});
  });

  it("should return all products (1 prod in DB)", async () => {
    await productModel(products[0]).save();

    await getProductController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(data.success).toBe(true);
    expect(data.countTotal).toEqual(1);
    expect(data.products).toHaveLength(1);
    expect(data.products[0].name).toEqual(products[0].name);
    expect(data.products[0].category._id).toEqual(products[0].category);
  });

  it("should return products with all its related data", async () => {
    await productModel(products[0]).save();

    await getProductController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(data.products[0].name).toEqual(products[0].name);
    expect(data.products[0].slug).toEqual(products[0].slug);
    expect(data.products[0].description).toEqual(products[0].description);
    expect(data.products[0].price).toEqual(products[0].price);
    expect(data.products[0].quantity).toEqual(products[0].quantity);
    expect(data.products[0].shipping).toEqual(products[0].shipping);
  });

  it("should exclude photo field from returned products", async () => {
    await productModel(products[0]).save();

    await getProductController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(data.products[0].toObject()).not.toHaveProperty("photo.data");
  });

  it("should return empty list (no prod in DB)", async () => {
    await getProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "All products fetched",
      countTotal: 0,
      products: [],
    });
  });

  it("should return all products (20 prods in DB)", async () => {
    for (let i = 1; i <= products.length; i++) {
      await productModel(products[i - 1]).save();
    }

    await getProductController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(data.success).toBe(true);
    expect(data.countTotal).toEqual(products.length);
    expect(data.products).toHaveLength(products.length);
  });

  it("should return all products in order of latest time created (6 prods in DB)", async () => {
    const currentDate = new Date();
    for (let i = 1; i <= products.length; i++) {
      const product = {
        ...products[i - 1],
        createdAt: new Date(currentDate.getTime() + (products.length - i)),  // force distinctly different times
      }
      await productModel(product).save();
    }

    await getProductController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    for (let i = 1; i <= products.length; i++) 
      expect(data.products[i - 1].name).toEqual(products[i - 1].name);
  });
});

describe("Test getSingleProductController with mongoose", () => {
  beforeEach(async () => {
    req = {params: {}};
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    await productModel.deleteMany({});
  });

  it("should return found product", async () => {
    req.params.slug = products[1].slug;
    await productModel(products[0]).save();
    await productModel(products[1]).save();

    await getSingleProductController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(data.success).toBe(true);
    expect(data.product.name).toEqual(products[1].name);
  });

  it("should return found product with its related data", async () => {
    req.params.slug = products[0].slug;
    await productModel(products[0]).save();

    await getSingleProductController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(data.product.name).toEqual(products[0].name);
    expect(data.product.slug).toEqual(products[0].slug);
    expect(data.product.description).toEqual(products[0].description);
    expect(data.product.price).toEqual(products[0].price);
    expect(data.product.quantity).toEqual(products[0].quantity);
    expect(data.product.shipping).toEqual(products[0].shipping);
  });

  it("should exclude photo field from returned product", async () => {
    req.params.slug = products[0].slug;
    await productModel(products[0]).save();

    await getSingleProductController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(data.product.toObject()).not.toHaveProperty("photo.data");
  });

  it("should return 404 if product not found", async () => {
    req.params.slug = "idk-bruh-you-tell-me";
    await productModel(products[0]).save();
    await productModel(products[1]).save();

    await getSingleProductController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(404);
    expect(data.success).toEqual(false);
  });

  it("should return 404 if product not found (empty DB)", async () => {
    req.params.slug = "idk-bruh-you-tell-me";

    await getSingleProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "No matching product found"
    });
  });
});

describe("Test productPhotoController with mongoose", () => {
  beforeEach(async () => {
    req = {params: {}};
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis()
    };
    await productModel.deleteMany({});
  });

  it("should return found product photo", async () => {
    const product = await productModel(products[0]).save();
    req.params.pid = product._id;

    await productPhotoController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(data).toMatchObject(product.photo.data);
  });

  it("should return only found product photo", async () => {
    await productModel(products[0]).save();
    const product = await productModel(products[1]).save();
    req.params.pid = product._id;

    await productPhotoController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(data).toMatchObject(product.photo.data);
  });

  it("should return 404 if product not found", async () => {
    await productModel(products[0]).save();
    const product = await productModel(products[1]);
    req.params.pid = product._id;

    await productPhotoController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Photo not found",
    });
  });

  it("should return 404 if empty DB", async () => {
    const product = await productModel(products[1]);
    req.params.pid = product._id;

    await productPhotoController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Photo not found",
    });
  });

  it("should return 404 if product does not have photo", async () => {
    const product = await productModel({...products[0], photo: undefined}).save();
    req.params.pid = product._id;

    await productPhotoController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Photo not found",
    });
  });
});

describe("Test productFiltersController with mongoose", () => {
  beforeEach(async () => {
    req = {body: {}};
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    await productModel.deleteMany({});
  });

  it("should return all products with an empty filter", async () => {
    await productModel({...products[0], category: categories[0]._id}).save();
    await productModel({...products[1], category: categories[1]._id}).save();
    await productModel({...products[2], category: categories[2]._id}).save();
    
    await productFiltersController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(data.success).toBe(true);
    expect(data.products).toHaveLength(3);
    expect(data.total).toBe(3);
  });

  describe("should return products matching price range", () => {
    beforeEach(async () => {
      await productModel({...products[0], price: 10}).save();
    });

    it("within boundary", async () => {
      req.body.radio = [0, 20];
      
      await productFiltersController(req, res);
      const data = res.send.mock.calls[0][0];

      expect(data.products).toHaveLength(1);
      expect(data.products[0].name).toEqual(products[0].name);
    });

    it("on lower boundary", async () => {
      req.body.radio = [10, 20];
      
      await productFiltersController(req, res);
      const data = res.send.mock.calls[0][0];

      expect(data.products).toHaveLength(1);
      expect(data.products[0].name).toEqual(products[0].name);
    });

    it("above lower boundary", async () => {
      req.body.radio = [9, 20];
      
      await productFiltersController(req, res);
      const data = res.send.mock.calls[0][0];

      expect(data.products).toHaveLength(1);
      expect(data.products[0].name).toEqual(products[0].name);
    });

    it("on upper boundary", async () => {
      req.body.radio = [0, 10];
      
      await productFiltersController(req, res);
      const data = res.send.mock.calls[0][0];

      expect(data.products).toHaveLength(1);
      expect(data.products[0].name).toEqual(products[0].name);
    });

    it("below upper boundary", async () => {
      req.body.radio = [0, 11];
      
      await productFiltersController(req, res);
      const data = res.send.mock.calls[0][0];

      expect(data.products).toHaveLength(1);
      expect(data.products[0].name).toEqual(products[0].name);
    });

    it("on both boundaries", async () => {
      req.body.radio = [10, 10];
      
      await productFiltersController(req, res);
      const data = res.send.mock.calls[0][0];

      expect(data.products).toHaveLength(1);
      expect(data.products[0].name).toEqual(products[0].name);
    });

    it("with multiple products", async () => {
      await productModel({...products[1], price: 10}).save();
      req.body.radio = [10, 10];
      
      await productFiltersController(req, res);
      const data = res.send.mock.calls[0][0];

      expect(data.products).toHaveLength(2);
    });
  });

  describe("should not return products outside of price range", () => {
    beforeEach(async () => {
      await productModel({...products[0], price: 10}).save();
    });

    it("below lower boundary", async () => {
      req.body.radio = [11, 20];
      
      await productFiltersController(req, res);
      const data = res.send.mock.calls[0][0];

      expect(data.products).toHaveLength(0);
    });

    it("above upper boundary", async () => {
      req.body.radio = [0, 9];
      
      await productFiltersController(req, res);
      const data = res.send.mock.calls[0][0];

      expect(data.products).toHaveLength(0);
    });

    it("or with invalid range", async () => {
      req.body.radio = [20, 0];
      
      await productFiltersController(req, res);
      const data = res.send.mock.calls[0][0];

      expect(data.products).toHaveLength(0);
    });

    it("with multiple products", async () => {
      await productModel({...products[1], price: 50}).save();
      req.body.radio = [0, 0];
      
      await productFiltersController(req, res);
      const data = res.send.mock.calls[0][0];

      expect(data.products).toHaveLength(0);
    });
  });

  it("should return multiple filtered products", async () => {
    await productModel({...products[0], price: 10}).save();
    await productModel({...products[1], price: 50}).save();  // reject this
    await productModel({...products[2], price: 15}).save();
    req.body.radio = [0, 20];

    await productFiltersController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(data.products).toHaveLength(2);
    expect(data.total).toBe(2);
    expect(data.products[0].name).not.toEqual(products[1].name);
    expect(data.products[1].name).not.toEqual(products[1].name);
  });

  it("should only return products matching category (1)", async () => {
    await productModel({...products[0], category: categories[0]._id}).save();
    req.body.checked = [categories[0]._id];

    await productFiltersController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(data.products).toHaveLength(1);
    expect(data.products[0].name).toEqual(products[0].name);
  });

  it("should only return products matching categories (2)", async () => {
    await productModel({...products[0], category: categories[0]._id}).save();
    await productModel({...products[1], category: categories[1]._id}).save();  // reject this
    await productModel({...products[2], category: categories[2]._id}).save();
    req.body.checked = [categories[0]._id, categories[2]._id];

    await productFiltersController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(data.products).toHaveLength(2);
    expect(data.products[0].name).not.toEqual(products[1].name);
    expect(data.products[1].name).not.toEqual(products[1].name);
  });

  it("should not return products not matching category", async () => {
    await productModel({...products[0], category: categories[0]._id}).save();
    await productModel({...products[1], category: categories[1]._id}).save();
    await productModel({...products[2], category: categories[2]._id}).save();
    const newCategory = await categoryModel({
                          name: "New Category",
                          slug: "new-category",
                        });
    req.body.checked = [newCategory._id];

    await productFiltersController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(data.products).toHaveLength(0);
    expect(data.total).toBe(0);
  });

  it("should return products matching both price and category", async () => {
    await productModel({...products[0], price: 10, category: categories[0]._id}).save();
    await productModel({...products[1], price: 50, category: categories[1]._id}).save();
    await productModel({...products[2], price: 15, category: categories[2]._id}).save();
    req.body.radio = [0, 20];
    req.body.checked = [categories[0]._id, categories[1]._id];

    await productFiltersController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(data.products).toHaveLength(1);
    expect(data.products[0].name).toEqual(products[0].name);
  });

  it("should return 6 most recent filtered products with correct total, page and pages", async () => {
    req.body.page = 1;

    await productModel({...products[0], category: categories[1]._id}).save(); // reject this
    const currentDate = new Date();
    for (let i = 1; i < 13; i++)
      await productModel({
              ...products[i],
              createdAt: new Date(currentDate.getTime() + (13 - i)),
              category: categories[0]._id
            }).save();
    req.body.checked = [categories[0]._id];
    
    await productFiltersController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(data.success).toBe(true);
    expect(data.products).toHaveLength(6);
    expect(data.total).toBe(12);
    expect(data.page).toBe(1);
    expect(data.pages).toBe(2);

    for (let i = 0; i < 6; i++) 
      expect(data.products[i].name).toEqual(products[i+1].name);
  });

  it("should return next 6 recent filtered products with correct page", async () => {
    req.body.page = 2;

    await productModel({...products[0], category: categories[1]._id}).save(); // reject this
    const currentDate = new Date();
    for (let i = 1; i < 13; i++)
      await productModel({
              ...products[i],
              createdAt: new Date(currentDate.getTime() + (13 - i)),
              category: categories[0]._id
            }).save();
    req.body.checked = [categories[0]._id];
    
    await productFiltersController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(data.success).toBe(true);
    expect(data.products).toHaveLength(6);
    expect(data.total).toBe(12);
    expect(data.page).toBe(2);
    expect(data.pages).toBe(2);

    for (let i = 0; i < 6; i++) 
      expect(data.products[i].name).toEqual(products[i+7].name);
  });

  it("should exclude photo data field from returned products", async () => {
    await productModel(products[0]).save();

    await productFiltersController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(data.products[0].toObject()).not.toHaveProperty("photo.data");
  });
});

describe("Test productCountController with mongoose", () => {
  beforeEach(async () => {
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    await productModel.deleteMany({});
  });

  it("should return 0 for empty DB", async () => {
    await productCountController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      total: 0,
    });
  });

  it("should return 1 for DB with only one product", async () => {
    await productModel(products[0]).save();

    await productCountController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      total: 1,
    });
  });

  it("should return 2 for DB with two products", async () => {
    await productModel(products[0]).save();
    await productModel(products[1]).save();

    await productCountController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      total: 2,
    });
  });

});

describe("Test productListController with mongoose", () => {
  beforeEach(async () => {
    req = {params: {}};
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    await productModel.deleteMany({});
  });

  it("should return all 6 products (6 in DB)", async () => {
    req.params.page = 1;
    for (let i = 0; i < 6; i++)
      await productModel(products[i]).save();

    await productListController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(data.success).toBe(true);
    expect(data.products).toHaveLength(6);
  });

  it("should return all 5 products (5 in DB)", async () => {
    req.params.page = 1;
    for (let i = 0; i < 5; i++)
      await productModel(products[i]).save();

    await productListController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(data.products).toHaveLength(5);
  });

  it("should return only 6 products (7 in DB)", async () => {
    req.params.page = 1;
    for (let i = 0; i < 7; i++)
      await productModel(products[i]).save();

    await productListController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(data.products).toHaveLength(6);
  });

  it("should return 6 most recent products (7 in DB)", async () => {
    req.params.page = 1;

    const currentDate = new Date();
    for (let i = 0; i < 8; i++)
      await productModel({
              ...products[i],
              createdAt: new Date(currentDate.getTime() + (7 - i))
            }).save();

    await productListController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    for (let i = 0; i < 6; i++)
      expect(data.products[i].name).toEqual(products[i].name);
  });

  it("should skip 6 most recent products and return next 6 (12 in DB)", async () => {
    req.params.page = 2;

    const currentDate = new Date();
    for (let i = 0; i < 12; i++)
      await productModel({
              ...products[i],
              createdAt: new Date(currentDate.getTime() + (7 - i))
            }).save();

    await productListController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    for (let i = 0; i < 6; i++)
      expect(data.products[i].name).toEqual(products[i + 6].name);
  });

  it("should return empty list with empty DB", async () => {
    req.params.page = 1;

    await productListController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(data.products).toHaveLength(0);
  });

  it("should return empty list when page exceeds total", async () => {
    req.params.page = 3;
    for (let i = 0; i < 12; i++)
      await productModel(products[i]).save();

    await productListController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(data.products).toHaveLength(0);
  });

  it("should still return 6 products without page parameter", async () => {
    for (let i = 0; i < 6; i++)
      await productModel(products[i]).save();

    await productListController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(data.products).toHaveLength(6);
  });

  it("should exclude photo field from returned products", async () => {
    req.params.page = 1;
    await productModel(products[0]).save();

    await productListController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(data.products[0].toObject()).not.toHaveProperty("photo.data");
  });
});

describe("Test productCategoryController with mongoose", () => {
  beforeEach(async () => {
    req = {params: {}};
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    await productModel.deleteMany({});
  });

  it("should handle requested category not found", async () => {
    req.params.slug = "life-is-suffering";
    await productCategoryController(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should return found category and products", async () => {
    req.params.slug = categories[0].slug;
    await productModel(products[0]).save();

    await productCategoryController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(data.success).toBe(true);
    expect(data.category._id).toEqual(categories[0]._id);
    expect(data.products[0].name).toEqual(products[0].name);
  });

  it("should not include photo field in returned products", async () => {
    req.params.slug = categories[0].slug;
    await productModel(products[0]).save();

    await productCategoryController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(data.products[0].toObject()).not.toHaveProperty("photo.data");
  });

  it("should return multiple matched products", async () => {
    req.params.slug = categories[0].slug;
    await productModel(products[0]).save();
    await productModel(products[1]).save();

    await productCategoryController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(data.products).toHaveLength(2);
    expect(data.products[0].name).toEqual(products[0].name);
    expect(data.products[1].name).toEqual(products[1].name);
  });

  it("should return empty list if no matched products", async () => {
    req.params.slug = categories[1].slug;
    await productModel(products[0]).save();
    await productModel(products[1]).save();

    await productCategoryController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(data.products).toHaveLength(0);
  });

  it("should return ONLY the matched products", async () => {
    req.params.slug = categories[1].slug;
    await productModel(products[0]).save();
    await productModel(products[1]).save();
    await productModel({...products[2], category: categories[1]._id}).save();

    await productCategoryController(req, res);
    const data = res.send.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(data.products).toHaveLength(1);
    expect(data.products[0].name).toEqual(products[2].name);
  });
});
