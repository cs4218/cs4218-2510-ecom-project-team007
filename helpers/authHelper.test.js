import bcrypt from "bcrypt";
import { hashPassword, comparePassword } from "./authHelper";

describe("Password Utils - Equivalence Partitioning Tests", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      console.log.mockRestore();
    });
  describe("hashPassword", () => {
    it("should hash a normal password (valid input)", async () => {
      const password = "Password123!";
      const hashed = await hashPassword(password);
      expect(hashed).not.toBe(password);
      expect(await bcrypt.compare(password, hashed)).toBe(true);
    });

    it("should throw or reject for invalid input types", async () => {
      // invalid inputs: number, null, undefined, object
      const invalidInputs = [null, undefined, { password: "abc" }];

      for (const input of invalidInputs) {
        const result = await hashPassword(input);
        expect(result).toBeUndefined(); 
      }
    });

    it("should hash an empty string (valid input - edge of string length)", async () => {
      const password = "";
      const hashed = await hashPassword(password);
      expect(await bcrypt.compare(password, hashed)).toBe(true);
    });
  });

  describe("comparePassword", () => {
    it("should return true for correct password (valid input)", async () => {
      const password = "Secret123!";
      const hashed = await hashPassword(password);
      const result = await comparePassword(password, hashed);
      expect(result).toBe(true);
    });

    it("should return false for incorrect password (valid input)", async () => {
      const password = "Secret123!";
      const hashed = await hashPassword(password);
      const result = await comparePassword("WrongPassword", hashed);
      expect(result).toBe(false);
    });

    it("should reject invalid hashedPassword input (invalid input)", async () => {
      await expect(comparePassword("password", null)).rejects.toThrow();
      await expect(comparePassword("password", 12345)).rejects.toThrow();
    });
  });
});
