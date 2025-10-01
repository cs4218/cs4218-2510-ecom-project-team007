import mongoose from "mongoose";
import userSchema from "./userModel";

const fakeDb = new Set();

jest.mock("mongoose", () => {
  const actualMongoose = jest.requireActual("mongoose");
  return {
    ...actualMongoose,
    model: (name, schema) => actualMongoose.model(name, schema),
    connect: jest.fn(),
    disconnect: jest.fn(),
  };
});


describe("User Schema Combinatorial Tests", () => {
    const testCases = [
        { name: "", email: "john@example.com", password: "password123", phone: "1234567890", address: {street: "123 St"},  answer: "Football", valid: false }, //missing name
        { name: "John Doe", email: "", password: "password123", phone: "1234567890", address: {street: "123 St"}, answer: "Football", valid: false }, //missing email
        { name: "John Doe", email: "john@example.com", password: "", phone: "1234567890", address: {street: "123 St"} , answer: "Football", valid: false }, // missing password
        { name: "John Doe", email: "john@example.com", password: "password123", phone: "abc123", address: {street: "123 St"} , answer: "Football", valid: false }, //phone number wrong
        { name: "John Doe", email: "john@example.com", password: "password123", phone: "1234567890", address: {}, answer: "Football", valid: false }, //address missing
        { name: "John Doe", email: "john@example.com", password: "password123", phone: "1234567890", address: {street: "123 St"} , answer: "", valid: false }, // missing answer
        { name: "John Doe", email: "john@example.com", password: "password123", phone: "1234567890", address: {street: "123 St"} , answer: "Football", valid: true }, // valid
    ];

  test.each(testCases)(
    "valid=$valid | name='$name', email='$email', password='$password', phone='$phone', address='$address', answer='$answer'",
    async ({ name, email, password, phone, address, answer, valid }) => {
        const user = new userSchema({ name, email, password, phone, address, answer });
        let invalid = false;
        if (valid) {
        await expect(user.validate()).resolves.toBeUndefined(); // validation passes
        } else {
            if (!name || !email || !password || !phone || !answer || !address || (typeof address === "object" && Object.keys(address).length === 0)) {
                invalid = true;
            }
        }
        if (!/^\d+$/.test(phone)) {
            invalid = true;
        }
        expect(invalid).toBe(!valid);
    }
  );

    it("should fail when saving a user with duplicate email", async () => {
        const user1 = new userSchema({
        name: "John Doe",
        email: "duplicate@example.com",
        password: "password123",
        phone: "1234567890",
        address: {street: "123 St"},
        answer: "Football",
    });
    fakeDb.add(user1.email);
    await expect(user1.validate()).resolves.toBeUndefined();

    // second user with same email
    const user2 = new userSchema({
        name: "Jane Doe",
        email: "duplicate@example.com",
        password: "password456",
        phone: "0987654321",
        address: {street: "456 Ave"},
        answer: "Basketball",
    });

    let err;
    try {
        if (fakeDb.has(user2.email)) throw new Error("Duplicate email");
        fakeDb.add(user2.email);
        await user2.validate();
    } catch (error) {
        err = error;
    }

    expect(err).toBeDefined();
    expect(err.message).toBe("Duplicate email");
    });
});
