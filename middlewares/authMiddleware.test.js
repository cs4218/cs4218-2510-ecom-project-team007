import JWT from "jsonwebtoken";
import { requireSignIn, isAdmin } from "./authMiddleware"; // adjust path
import userModel from "../models/userModel";

jest.mock("jsonwebtoken");
jest.mock("../models/userModel");

describe("Auth Middleware BVA Tests", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    req = { headers: {} };
    res = {
      status: jest.fn(() => res),
      send: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    console.log.mockRestore()
  });
  
  it("should call next() with valid token", async () => {
    const fakePayload = { _id: "user1", role: 0 };
    req.headers.authorization = "validtoken";
    JWT.verify.mockReturnValue(fakePayload);

    await requireSignIn(req, res, next);

    expect(req.user).toEqual(fakePayload);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 401 with 'Token expired' for expired token", async () => {
    req.headers.authorization = "expiredtoken";
    JWT.verify.mockImplementation(() => {
      const err = new Error("jwt expired");
      err.name = "TokenExpiredError";
      throw err;
    });

    await requireSignIn(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Token expired",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 with 'Invalid token' for malformed/empty token", async () => {
    req.headers.authorization = "";
    JWT.verify.mockImplementation(() => {
      throw new Error("jwt malformed");
    });

    await requireSignIn(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should allow admin user (role=1)", async () => {
    req.user = { _id: "admin1" };
    userModel.findById.mockResolvedValue({ _id: "admin1", role: 1 });

    await isAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should block non-admin user (role=0)", async () => {
    req.user = { _id: "user1" };
    userModel.findById.mockResolvedValue({ _id: "user1", role: 0 });

    await isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "UnAuthorized Access",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should handle error if user not found (null returned)", async () => {
    req.user = { _id: "userX" };
    userModel.findById.mockResolvedValue(null);

    await isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: "Error in admin middleware",
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it("should handle DB error gracefully", async () => {
    req.user = { _id: "user1" };
    userModel.findById.mockRejectedValue(new Error("DB down"));

    await isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: "Error in admin middleware",
    }));
    expect(next).not.toHaveBeenCalled();
  });
});
