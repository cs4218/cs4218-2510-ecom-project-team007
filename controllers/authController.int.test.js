import mongoose from "mongoose";
import dotenv from "dotenv";
import supertest from "supertest";
import app from "../app.js";
import userModel from "../models/userModel.js";
import { hashPassword } from "../helpers/authHelper.js";

dotenv.config();

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL);
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(async () => {
  console.log.mockRestore();
  await userModel.deleteMany({ email: { $in: ["john@gmail.com","test@example.com","newuser@example.com"] } });

});

describe("Integration test for registerController, userModel, and hashPassword", () => {
  test("should return 400 if 'name' is missing", async () => {
    const newUser = {
      email: "test@example.com",
      password: "password123",
      phone: "1234567890",
      address: "Test Address",
      answer: "Test Answer"
    };

    const response = await supertest(app)
      .post("/api/v1/auth/register")
      .send(newUser);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Name is Required");
  });

  test("should return 400 if 'email' is missing", async () => {
    const newUser = {
      name: "Test User",
      password: "password123",
      phone: "1234567890",
      address: "Test Address",
      answer: "Test Answer"
    };

    const response = await supertest(app)
      .post("/api/v1/auth/register")
      .send(newUser);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Email is Required");
  });

  test("should return 400 if 'password' is missing", async () => {
    const newUser = {
      name: "Test User",
      email: "test@example.com",
      phone: "1234567890",
      address: "Test Address",
      answer: "Test Answer"
    };

    const response = await supertest(app)
      .post("/api/v1/auth/register")
      .send(newUser);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Password is Required");
  });

  test("should return 200 if user with same email is already registered", async () => {
    const existingUser = {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      phone: "1234567890",
      address: "Test Address",
      answer: "Test Answer"
    };

    await new userModel(existingUser).save();

    const response = await supertest(app)
      .post("/api/v1/auth/register")
      .send(existingUser);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Already Register please login");
  });

  test("should successfully register a new user and hash password", async () => {
    const newUser = {
      name: "Test User",
      email: "newuser@example.com",
      password: "password123",
      phone: "1234567890",
      address: "Test Address",
      answer: "Test Answer"
    };

    const response = await supertest(app)
      .post("/api/v1/auth/register")
      .send(newUser);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("User Register Successfully");

    const savedUser = await userModel.findOne({ email: newUser.email });
    expect(savedUser).not.toBeNull();
    expect(savedUser.email).toBe(newUser.email);
    expect(savedUser.name).toBe(newUser.name);
    
    expect(savedUser.password).not.toBe(newUser.password);
    expect(savedUser.password).toMatch(/^\$2[aby]\$.{56,}$/);
  });

  test("should return 500 if there is a server error", async () => {
    jest.spyOn(userModel.prototype, "save").mockImplementationOnce(() => {
      throw new Error("Database Error");
    });

    const newUser = {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      phone: "1234567890",
      address: "Test Address",
      answer: "Test Answer"
    };

    const response = await supertest(app)
      .post("/api/v1/auth/register")
      .send(newUser);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Error in Registeration");
  });

  test("should return 400 if 'answer' is missing", async () => {
    const newUser = {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      phone: "1234567890",
      address: "Test Address"
    };

    const response = await supertest(app)
      .post("/api/v1/auth/register")
      .send(newUser);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Answer is Required");
  });
});


describe("Integration Test for loginController", () => {
  test("should return 404 if email or password is missing", async () => {
    const response = await supertest(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@example.com" }); // Missing password

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid email or password");
  });

  test("should return 404 if email is not registered", async () => {
    const response = await supertest(app)
      .post("/api/v1/auth/login")
      .send({ email: "nonexistent@example.com", password: "password123" });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Email is not registered");
  });

  test("should return 200 if password is incorrect", async () => {
    const hashedPassword = await hashPassword("correctPassword");
    const user = new userModel({
      name: "Test User",
      email: "test@example.com",
      password: hashedPassword,
      phone: "1234567890",
      address: "Test Address",
      answer: "Test Answer",
    });
    await user.save();

    const response = await supertest(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@example.com", password: "wrongPassword" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid Password");
  });

  test("should return 200 for successful login", async () => {
    const hashedPassword = await hashPassword("correctPassword");
    const user = new userModel({
      name: "Test User",
      email: "test@example.com",
      password: hashedPassword,
      phone: "1234567890",
      address: "Test Address",
      answer: "Test Answer",
    });
    await user.save();

    const response = await supertest(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@example.com", password: "correctPassword" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("login successfully");
    expect(response.body.user.email).toBe("test@example.com");
    expect(response.body.token).toBeDefined(); // Ensure token is returned
  });

  test("should return 500 for internal server error", async () => {
    jest.spyOn(userModel, "findOne").mockImplementationOnce(() => {
      throw new Error("DB Error");
    });

    const response = await supertest(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@example.com", password: "correctPassword" });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Error in login");

    userModel.findOne.mockRestore();
  });
});

describe("forgotPasswordController (Integration with real MongoDB)", () => {
  test("should return 400 if email is missing", async () => {
    const res = await supertest(app)
      .post("/api/v1/auth/forgot-password")
      .send({ answer: "blue", newPassword: "123456" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Email is required" );
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

    const res = await supertest(app)
      .post("/api/v1/auth/forgot-password")
      .send({
        email: "john@gmail.com",
        answer: "wrongAnswer",
        newPassword: "newpass123",
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Wrong Email Or Answer");
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

    const res = await supertest(app)
      .post("/api/v1/auth/forgot-password")
      .send({
        email: "john@gmail.com",
        answer: "blue",
        newPassword: "newpass123",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Password Reset Successfully")

    const updatedUser = await userModel.findById(user._id);
    expect(updatedUser.password).not.toBe(hashed);
  });

  test("should handle unexpected server error gracefully", async () => {

    jest.spyOn(userModel, "findOne").mockImplementationOnce(() => {
      throw new Error("DB connection lost");
    });

    const res = await supertest(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "x", answer: "y", newPassword: "z" });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Something went wrong")

    userModel.findOne.mockRestore();
  });
});
