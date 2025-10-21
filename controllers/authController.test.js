import { registerController, loginController, forgotPasswordController, getOrdersController, getAllOrdersController, orderStatusController } from "../controllers/authController.js";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import { hashPassword, comparePassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";

jest.mock("../models/userModel.js");
jest.mock("../models/orderModel.js");
jest.mock("../helpers/authHelper.js");
jest.mock("jsonwebtoken");

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe("Auth Controller Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("registerController using combinatorial tests", () => {
    const baseUser = {
      name: "Alice",
      email: "alice@test.com",
      password: "Password123",
      phone: "123456789",
      address: "Wonderland",
      answer: "Rabbit",
    };

    const requiredFields = ["name", "email", "password", "phone", "address", "answer"];

    test.each(requiredFields)(
      "should fail if fields is missing", async (missingField) => {
        const req = { body: { ...baseUser } };
        delete req.body[missingField];
        const res = mockResponse();

        await registerController(req, res);

        expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
            ...(req.body.name === undefined
            ? { error: expect.any(String) }
            : { message: expect.any(String) })
        }));

      }
    );

    test("should fail if user already exists", async () => {
      userModel.findOne.mockResolvedValue(baseUser);
      const req = { body: baseUser };
      const res = mockResponse();

      await registerController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    test("should return 500 if an exception occurs", async () => {
        const req = { body: { ...baseUser } };
        const res = mockResponse();

        userModel.findOne.mockResolvedValue(null);
        userModel.mockImplementation(() => ({
            save: jest.fn().mockRejectedValue(new Error("Database down")),
        }));

        await registerController(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
            success: false,
            message: "Error in Registeration",
            error: expect.any(Error),
            })
        );
    });

    test("should register successfully", async () => {
      userModel.findOne.mockResolvedValue(null);
      hashPassword.mockResolvedValue("hashedPwd");
      userModel.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(baseUser),
      }));

      const req = { body: baseUser };
      const res = mockResponse();

      await registerController(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe("loginController using combinatorial test", () => {
    const baseLogin = { email: "bob@test.com", password: "Pass123" };
    const fakeUser = {
      _id: "user123",
      name: "Bob",
      email: "bob@test.com",
      phone: "123456",
      address: "Nowhere",
      password: "hashed",
      role: 0,
    };

    test.each([
      [{ email: "", password: "" }, 404, "Invalid email or password"],
      [{ email: "bob@test.com", password: "" }, 404, "Invalid email or password"],
      [{ email: "", password: "Pass123" }, 404, "Invalid email or password"],
    ])("should reject invalid inputs or missing", async (body, status, msg) => {
      const req = { body };
      const res = mockResponse();

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(status);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: msg }));
    });

    test("should fail if user not found", async () => {
      userModel.findOne.mockResolvedValue(null);
      const req = { body: baseLogin };
      const res = mockResponse();

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    test("should fail if password mismatch", async () => {
      userModel.findOne.mockResolvedValue(fakeUser);
      comparePassword.mockResolvedValue(false);
      const req = { body: baseLogin };
      const res = mockResponse();

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    test("should login successfully", async () => {
      userModel.findOne.mockResolvedValue(fakeUser);
      comparePassword.mockResolvedValue(true);
      JWT.sign.mockReturnValue("fakeToken");

      const req = { body: baseLogin };
      const res = mockResponse();

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        token: "fakeToken",
      }));
    });
  });

  describe("forgotPasswordController using combinatorial test", () => {
    const baseForgot = { email: "bob@test.com", answer: "dog", newPassword: "newPass" };
    const fakeUser = { _id: "u1", password: "hashed" };

    test.each([
      [{ email: "", answer: "dog", newPassword: "x" }, "Email is required"],
      [{ email: "a@test.com", answer: "", newPassword: "x" }, "answer is required"],
      [{ email: "a@test.com", answer: "dog", newPassword: "" }, "New Password is required"],
    ])("should fail for invalid input or missing", async (body, msg) => {
      const req = { body };
      const res = mockResponse();

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: msg }));
    });

    test("should fail if user not found", async () => {
      userModel.findOne.mockResolvedValue(null);
      const req = { body: baseForgot };
      const res = mockResponse();

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    test("should reset password successfully", async () => {
      userModel.findOne.mockResolvedValue(fakeUser);
      hashPassword.mockResolvedValue("newHashed");
      userModel.findByIdAndUpdate.mockResolvedValue({});

      const req = { body: baseForgot };
      const res = mockResponse();

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});

/*********************Test case for  updateProfileController*********************/


/**
 * This section is done by Wei Nian.
 * Apply condition coverage and testing boundary values. First create equivalence partitioning for efficient testing.
 * Password: valid (>=6 characters), invalid (<6 characters), not provided
 * Name: valid (non-empty string), invalid (empty string)
 * Address: valid (non-empty string), invalid (empty string)
 * Phone: valid (non-empty string), invalid (empty string)
 */

const { updateProfileController } = require("./authController");
const authHelper = require("../helpers/authHelper");

describe("updateProfileController", () => {
  const mockUser = { password: "oldpass", name: "Old Name", phone: "123", address: "Addr" };

  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    userModel.findById = jest.fn().mockResolvedValue(mockUser);
    userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUser);

    jest.spyOn(authHelper, "hashPassword").mockImplementation((pw) => `hashed-${pw}`);

    req = { user: { _id: "1" }, body: { name: "New Name" } };
    res = { status: jest.fn().mockReturnThis(), send: jest.fn(), json: jest.fn() };
  });

  it("TC1: No password provided -> should succeed", async () => {
    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        updatedUser: mockUser,
        message: "Profile Updated Successfully",
      })
    );
  });

  it("TC2: Valid password length = 6 -> should hash and update", async () => {
      req.body = { password: "123456", name: "John", address: "A", phone: "B" };
      await updateProfileController(req, res);
      expect(authHelper.hashPassword).toHaveBeenCalledWith("123456");
      expect(userModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
  });

  // In authController.test.js, update the failing test:
  it("TC3: Invalid password length = 5 -> should fail", async () => {
    req.body = { password: "123", name: "John", address: "A", phone: "B" };
    await updateProfileController(req, res);
    
    // Change from toHaveBeenCalledWith to check status and send
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Passsword is required and 6 character long",
      })
    );
  });

  it("TC4: Valid password length = 7 -> should hash and update", async () => {
    req.body = { password: "1234567", name: "John", address: "A", phone: "B" };
    await updateProfileController(req, res);
    expect(authHelper.hashPassword).toHaveBeenCalledWith("1234567");
    expect(userModel.findByIdAndUpdate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("TC5: Empty name -> should succeed and update with old name", async () => {
    req.body = { name: "", password: "123456", address: "A", phone: "B" };
    await updateProfileController(req, res);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        updatedUser: { ...mockUser, name: "Old Name" },
        message: "Profile Updated Successfully",
      })
    );
  });

  it("TC6: Empty address -> should succeed and update with old address", async () => {
    req.body = { address: "", password: "123456", name: "John", phone: "B" };
    await updateProfileController(req, res);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        updatedUser: { ...mockUser, address: "Addr" },
        message: "Profile Updated Successfully",
      })
    );
  });

  it("TC7: Empty phone -> should succeed and update with old phone", async () => {
    req.body = { phone: "", password: "123456", name: "John", address: "A" };
    await updateProfileController(req, res);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        updatedUser: { ...mockUser, phone: "123" },
        message: "Profile Updated Successfully",
      })
    );
  });

  it("TC8: All valid inputs -> should hash password and update all fields", async () => {
    req.body = { password: "validPass", name: "John", address: "A", phone: "B" };
    await updateProfileController(req, res);
    expect(authHelper.hashPassword).toHaveBeenCalledWith("validPass");
    expect(userModel.findByIdAndUpdate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        updatedUser: mockUser,
        message: "Profile Updated Successfully",
      })
    );
  });

  it("TC9: DB throws error → should handle with 400 status", async () => {
    req.body = { name: "John" };
    const mockError = new Error("Database failure");

    userModel.findById.mockRejectedValue(mockError);

    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error while updating profile",
      })
    );
  });
});


describe("getOrdersController", () => {
  let req, res;

  beforeEach(() => {
    req = { user: { _id: "user123" } };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("should fetch orders successfully", async () => {

    const mockOrders = [
      {
        _id: "order1",
        buyer: { _id: "user123", name: "John" },
        products: [{ name: "item1" }],
      },
    ];

    // Mock the chained query methods
    const populateMock = jest.fn().mockReturnThis();
    orderModel.find.mockReturnValue({
      populate: populateMock,
    });

    populateMock
      .mockReturnValueOnce({ populate: populateMock }) // for .populate("products", "-photo")
      .mockReturnValueOnce({ populate: populateMock }) // for .populate("buyer", "name")
      .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(mockOrders) });

    orderModel.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      then: jest.fn((cb) => cb(mockOrders)),
    });   

    await getOrdersController(req, res);

    expect(orderModel.find).toHaveBeenCalledWith({ buyer: "user123" });
    expect(res.json).toHaveBeenCalledWith(mockOrders);
  });

  it("should handle errors", async () => {
    const mockError = new Error("DB failed");

    orderModel.find.mockImplementation(() => {
      throw mockError;
    });

    await getOrdersController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error while getting orders",
      })
    );
  });
});

describe("getAllOrdersController", () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("should return all orders successfully", async () => {
    const mockOrders = [
      { _id: "order1", buyer: { _id: "b1", name: "John" }, products: [{ name: "item1" }] },
      { _id: "order2", buyer: { _id: "b2", name: "Alice" }, products: [{ name: "item2" }] },
    ];

    // Mock Mongoose chain
    const populateMock = jest.fn().mockReturnThis();
    orderModel.find.mockReturnValue({
      populate: populateMock,
      sort: jest.fn().mockResolvedValue(mockOrders),
    });

    await getAllOrdersController(req, res);

    expect(orderModel.find).toHaveBeenCalledWith({});
    expect(res.json).toHaveBeenCalledWith(mockOrders);
  });

  it("should handle errors gracefully", async () => {
    const mockError = new Error("DB failed");
    orderModel.find.mockImplementation(() => {
      throw mockError;
    });

    await getAllOrdersController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error while getting orders",
      })
    );
  });
});

describe("orderStatusController", () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("should update order status successfully", async () => {
    const mockUpdatedOrder = { _id: "order123", status: "Shipped" };

    req.params.orderId = "order123";
    req.body.status = "Shipped";

    orderModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedOrder);

    await orderStatusController(req, res);

    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "order123",
      { status: "Shipped" },
      { new: true }
    );

    expect(res.json).toHaveBeenCalledWith(mockUpdatedOrder);
  });

  it("should handle errors gracefully", async () => {
    const mockError = new Error("DB failed");
    req.params.orderId = "order123";
    req.body.status = "Delivered";

    orderModel.findByIdAndUpdate.mockRejectedValue(mockError);

    await orderStatusController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error While Updateing Order",
      })
    );
  });
});