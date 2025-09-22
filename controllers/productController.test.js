// paymentController.test.js

const { describe } = require("node:test");

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