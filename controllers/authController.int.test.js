import mongoose from "mongoose";
import dotenv from "dotenv";
import userModel from "../models/userModel.js";
import { forgotPasswordController } from "../controllers/authController.js";
import { hashPassword } from "../helpers/authHelper.js";

dotenv.config();

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(async () => {
  await userModel.deleteMany({});
  console.log.mockRestore();
});

describe("forgotPasswordController (Integration with real MongoDB)", () => {
  test("should return 400 if email is missing", async () => {
    const req = { body: { answer: "blue", newPassword: "123456" } };
    const res = mockResponse();

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: "Email is required" });
  });

  test("should return 404 if email or answer is incorrect", async () => {
    const hashed = await hashPassword("oldpass");
    await new userModel({
      name: "John",
      email: "john@gmail.com",
      password: hashed,
      phone: "123456",
      address: "Earth",
      answer: "blue",
    }).save();

    const req = {
      body: {
        email: "john@gmail.com",
        answer: "wrongAnswer",
        newPassword: "newpass123",
      },
    };
    const res = mockResponse();

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Wrong Email Or Answer",
    });
  });

  test("should successfully update password and return 200", async () => {
    const hashed = await hashPassword("oldpass");
    const user = await new userModel({
      name: "John",
      email: "john@gmail.com",
      password: hashed,
      phone: "123456",
      address: "Earth",
      answer: "blue",
    }).save();

    const req = {
      body: {
        email: "john@gmail.com",
        answer: "blue",
        newPassword: "newpass123",
      },
    };
    const res = mockResponse();

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Password Reset Successfully",
    });

    const updatedUser = await userModel.findById(user._id);
    expect(updatedUser.password).not.toBe(hashed);
  });

  test("should handle unexpected server error gracefully", async () => {

    jest.spyOn(userModel, "findOne").mockImplementationOnce(() => {
      throw new Error("DB connection lost");
    });

    const req = { body: { email: "x", answer: "y", newPassword: "z" } };
    const res = mockResponse();

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Something went wrong",
      })
    );

    userModel.findOne.mockRestore();
  });
});
