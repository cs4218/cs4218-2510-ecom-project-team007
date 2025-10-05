import productModel from "../models/productModel";
import {
  getProductController,
  getSingleProductController,
  productPhotoController,
  productFiltersController,
  productCountController,
  productListController,
} from '../controllers/productController';

jest.mock('../models/productModel');


describe("Test getProductController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    }
  });

  it("Should return all (2) products successfully", async () => {
    const twoProducts = [
      { name: "Product1", category: { name: "Category1" } },
      { name: "Product2", category: { name: "Category2" } }
    ];

    const query = {
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(twoProducts),
    };
    productModel.find.mockReturnValue(query);

    await getProductController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      countTotal: twoProducts.length,
      message: "All products fetched",
      products: twoProducts,
    });
  });

  it("Should handle errors", async () => {
    const errorMessage = "DB query error";
    productModel.find.mockImplementation(() => { throw new Error(errorMessage); });

    await getProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in getting products",
      error: errorMessage
    });
  });
});


describe("Test getSingleProductController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { slug: "test-product" } };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    }
  });

  it("Should return test product successfully (200)", async () => {
    const testProduct = { name: "Test Product", slug: "test-product", category: { name: "Category2" } };

    const query = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(testProduct),
    };
    productModel.findOne.mockReturnValue(query);

    await getSingleProductController(req, res);
    
    expect(productModel.findOne).toHaveBeenCalledWith({ slug: "test-product" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Single product fetched",
      product: testProduct
    });
  });

  it("Should handle empty requests (400)", async () => {
    req = {};

    await getSingleProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Missing parameter in request"
    });
  });

  it("Should handle no product found (404)", async () => {
    const query = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(null),
    };
    productModel.findOne.mockReturnValue(query);

    await getSingleProductController(req, res);
    
    expect(productModel.findOne).toHaveBeenCalledWith({ slug: "test-product" });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "No matching product found"
    });
  });

  it("Should handle errors (500)", async () => {
    const errorMessage = "DB query error";
    productModel.findOne.mockImplementation(() => { throw new Error(errorMessage); });

    await getSingleProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error while getting single product",
        error: errorMessage
      })
    );
  });
});


describe("Test productPhotoController", () => {
  let req, res;
  const testPid = "testpid123";

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { pid: testPid } };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      set: jest.fn()
    }
  });

   it("Should return photo data with correct content type (200)", async () => {
    const testPhoto = {
      data: "test-data",
      contentType: "image/png"
    };

    productModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ photo: testPhoto })
    });

    await productPhotoController(req, res);

    expect(productModel.findById).toHaveBeenCalledWith(testPid);
    expect(res.set).toHaveBeenCalledWith("Content-type", "image/png");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(testPhoto.data);
  });

  it("Should handle empty requests (400)", async () => {
    req = {};

    await productPhotoController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Missing parameter in request"
    });
  });

  it("Should handle photo not found (404)", async () => {
    productModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });

    await productPhotoController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Photo not found",
    });
  });

  it("Should handle photo without data (404)", async () => {
    productModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ photo: {} })
    });

    await productPhotoController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Photo not found",
    });
  });

  it("Should handle errors (500)", async () => {
    const errorMessage = "DB query error";

    productModel.findById.mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error(errorMessage))
    });

    await productPhotoController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error while getting photo",
        error: errorMessage
      })
    );
  });
});


describe("Test productFiltersController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    }
  });

   it("Should filter by category when checked is not empty (200)", async () => {
    const testchecked = ["category1"];
    req.body.checked = testchecked;
    const testProducts = [{name: "product1"}, {name: "product2"}];
    productModel.find.mockResolvedValue(testProducts);

    await productFiltersController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({category: testchecked});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: testProducts,
    });
  });

  it("Should filter by price when radio is not empty (200)", async () => {
    const testradio = [0, 20];
    req.body.radio = testradio;
    const testProducts = [{name: "product1"}, {name: "product2"}];
    productModel.find.mockResolvedValue(testProducts);

    await productFiltersController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({price: {$gte: testradio[0], $lte: testradio[1]} });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: testProducts,
    });
  });

  it("Should filter by both when checked and radio is not empty (200)", async () => {
    const testchecked = ["category1"];
    const testradio = [0, 20];
    req.body.checked = testchecked;
    req.body.radio = testradio;
    const testProducts = [{name: "product1"}, {name: "product2"}];
    productModel.find.mockResolvedValue(testProducts);

    await productFiltersController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({
      category: testchecked,
      price: {$gte: testradio[0], $lte: testradio[1]}
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: testProducts,
    });
  });

  it("Should not filter anything when neither are given (200)", async () => {
    const testProducts = [{name: "product1"}, {name: "product2"}];
    productModel.find.mockResolvedValue(testProducts);

    await productFiltersController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: testProducts,
    });
  });

  it("Should not filter by price if radio length is not 2 (400)", async () => {
    const testradio = [0, 20, 10];
    req.body.radio = testradio;

    await productFiltersController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid radio field"
    });
  });

  it("Should not filter by price if radio is not an array (400)", async () => {
    const testradio = 123;
    req.body.radio = testradio;

    await productFiltersController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid radio field"
    });
  });

  it("Should handle errors (500)", async () => {
    const errorMessage = "DB query error";
    productModel.find.mockRejectedValue(new Error(errorMessage));

    await productFiltersController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error while filtering products",
        error: errorMessage
      })
    );
  });
});


describe("Test productCountController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    }
  });

  it("Should return total count of products (200)", async () => {
    const testTotal = 69;
    productModel.find.mockReturnValue({
      estimatedDocumentCount: jest.fn().mockResolvedValue(testTotal)
    });

    await productCountController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      total: testTotal
    });
  });

  it("Should handle errors (500)", async () => {
    const errorMessage = "DB query error";
    productModel.find.mockReturnValue({
      estimatedDocumentCount: jest.fn().mockRejectedValue(new Error(errorMessage))
    });

    await productCountController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error in product count",
        error: errorMessage
      })
    );
  });
});


describe("Test productListController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    }
  });

  describe("Query should be successful when", () => {
    const stubProducts = {category: "sample"};

    it("request for page 1", async () => {
      req = { params: { page: 1 }};
    
      const query = {
        skip: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(stubProducts),
      };
      productModel.find.mockReturnValue(query);

      await productListController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: stubProducts
      });
    });

    it("request for page 0", async () => {
      req = { params: { page: 0 }};
    
      const query = {
        skip: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(stubProducts),
      };
      productModel.find.mockReturnValue(query);

      await productListController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: stubProducts
      });
    });

    it("request for page 12", async () => {
      req = { params: { page: 12 }};
    
      const query = {
        skip: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(stubProducts),
      };
      productModel.find.mockReturnValue(query);

      await productListController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: stubProducts
      });
    });
  });

  it("Correct skip count should be passed to mongoose", async () => {
    req = { params: { page: 12 }};

    const query = {
      skip: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(undefined),
    };
    productModel.find.mockReturnValue(query);

    await productListController(req, res);

    expect(query.skip).toHaveBeenCalledWith(66);  // 6 * (12 - 1)
  });

  describe("Proper error handling when", () => {
    it ("params field not included in request", async () => {
      await productListController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Missing parameter in request"
      });
    });

    it ("invalid page value", async () => {
      const req = { params: { page: -1 }};

      await productListController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid 'page' parameter in request"
      });
    });

    it ("server error", async () => {
      req = { params: { page: 1 }};
      const errorMessage = "DB query error";
      productModel.find.mockImplementation(() => { throw new Error(errorMessage); });

      await productListController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in product list",
        error: errorMessage
      });
    });
  });
});


// paymentController.test.js

/********************************Payment Test Case*************************************** */

// Top-level variable to control mock behavior
let mockGenerateResponse;
const SUCCESS_TOKEN = "success-token";

// Mock the braintree module before importing the controller
jest.mock("braintree", () => ({
  BraintreeGateway: jest.fn(() => {
    return {
      transaction: {
        sale: jest.fn((transaction, cb) => {
          // simulate successful transaction
          cb(null, { _id: "txn_123", status: "success" });
        }),
      },
      clientToken: {
        generate: (opts, cb) => {
          if (mockGenerateResponse instanceof Error) {
            cb(mockGenerateResponse); // token generation error
          } else {
            cb(null, { clientToken: mockGenerateResponse || SUCCESS_TOKEN });
          }
        },
      },
    };
  }),
  Environment: { Sandbox: "sandbox" },
}));

jest.mock("../models/orderModel", () => {
  return jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue({}), // resolves immediately
  }));
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);  // add this
  return res;
};

//100% decision coverage
describe("braintreeTokenController", () => {

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockGenerateResponse = null; // reset before each test
  });
  
  it("should send a token on successful generation", async () => {
    const req = {};
    const res = mockRes();
    const { braintreeTokenController } = require("./productController");
    mockGenerateResponse = SUCCESS_TOKEN
    await braintreeTokenController(req, res);

    // assert that the mocked generate was called
    expect(res.send).toHaveBeenCalledWith({ clientToken: SUCCESS_TOKEN });
  });

  it("should handle errors from the gateway", async () => {
    const req = {};
    const res = mockRes();
    const { braintreeTokenController } = require("./productController");
    mockGenerateResponse = new Error("Generation failed");
    await braintreeTokenController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(mockGenerateResponse);
  });

  it("should handle unexpected thrown errors (outer catch)", async () => {
    const req = {};
    const res = mockRes();
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    // Mock the braintree module before importing the controller. Exclude clientToken to cause error
    jest.doMock("braintree", () => ({
      BraintreeGateway: jest.fn(() => {
        return {
          transaction: {
            sale: jest.fn((transaction, cb) => {
              // simulate successful transaction
              cb(null, { _id: "txn_123", status: "success" });
            }),
          },
        };
      }),
      Environment: { Sandbox: "sandbox" },
    }));
    const { braintreeTokenController } = require("./productController");

    await braintreeTokenController(req, res);

    expect(res.send).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
  });
});

describe("brainTreePaymentController", () => {

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("should process payment successfully", async () => {
    const req = { body: { nonce: "fake-nonce", cart: [{ price: 10 }] }, user: { _id: "user_123" } };
    const res = mockRes();
    const { brainTreePaymentController } = require("./productController");

    await brainTreePaymentController(req, res);

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
    });
  });

  //Expected to fail but did not. Total did not check if its Not a Number. After fixing code, it caught the error and pass test case.
  it('should return 400 if price is not a number', async () => {
    const req = {
      body: {nonce: 'nonce', cart: [{ price: '123' }]},
      user: { _id: 'user123' }
    };
    const res = mockRes();
    const { brainTreePaymentController } = require("./productController");
    
    await brainTreePaymentController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Invalid price');
  });

  
  // Current code will crash on req.user._id, so test fails
  it('should fail if req.user is missing', async () => {
    const req = {
      body: { nonce: 'nonce', cart: [{ price: 10 }] }, // no user
      // user is missing
    };
    const res = mockRes();
    const { brainTreePaymentController } = require("./productController");

    await brainTreePaymentController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('User not logged in');
  });

  it("should return 400 if cart is missing", async () => {
    const req = { body: {}, user: { _id: "user_123" } };
    const res = mockRes();
    const { brainTreePaymentController } = require("./productController");

    await brainTreePaymentController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Cart is required");
  });

  it("should return 400 if cart is empty", async () => {
    const req = { body: { cart: [] }, user: { _id: "user_123" } };
    const res = mockRes();
    const { brainTreePaymentController } = require("./productController");

    await brainTreePaymentController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Cart is required");
  });

it("should handle transaction sale error", async () => {
    // Mock gateway.transaction.sale to call back with error
    jest.doMock("braintree", () => ({
      BraintreeGateway: jest.fn(() => ({
        clientToken: { generate: jest.fn() },
        transaction: {
          sale: jest.fn((_, cb) => cb(new Error("Payment failed"), null)),
        },
      })),
      Environment: { Sandbox: "sandbox" },
    }));
    
    const { brainTreePaymentController } = require("./productController");
    const req = { body: { nonce: "nonce", cart: [{ price: 10 }] }, user: { _id: "user_123" } };
    const res = mockRes();

    await brainTreePaymentController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(expect.any(Error));
  });

it("should catch synchronous exceptions (outer catch), gateway is undefined", async () => {
    // Mock gateway to throw synchronously
    jest.doMock("braintree", () => ({
      BraintreeGateway: jest.fn(() => {
        return {};
      }),
      Environment: { Sandbox: "sandbox" },
    }));
    
    const { brainTreePaymentController } = require("./productController");
    const req = { body: { nonce: "nonce", cart: [{ price: 10 }] }, user: { _id: "user_123" } };
    const res = mockRes();

    // spy on console.log to verify catch
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await brainTreePaymentController(req, res);

    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));

    consoleSpy.mockRestore();
  });
});
