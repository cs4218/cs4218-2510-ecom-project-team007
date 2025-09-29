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
