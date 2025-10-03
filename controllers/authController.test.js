import { registerController, loginController, forgotPasswordController } from "../controllers/authController.js";
import userModel from "../models/userModel.js";
import { hashPassword, comparePassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";

jest.mock("../models/userModel.js");
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
