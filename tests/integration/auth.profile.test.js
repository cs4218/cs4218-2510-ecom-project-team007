import request from "supertest";
import app from "../../app.js";
import JWT from "jsonwebtoken";
import bcrypt from 'bcrypt';
import { connectTestDB, closeTestDB, clearTestDB } from "./setup.js";
import User from "../../models/userModel.js";

let userToken;
let testUser;

beforeAll(async () => {
    await connectTestDB();
});

afterAll(async () => {
    await closeTestDB();
});

beforeEach(async () => {
    await clearTestDB();

    const password = await bcrypt.hash('password123', 10);
    testUser = await User.create({
        name: 'Alena Hey',
        email: 'alenahey@test.com',
        password: password,
        phone: '98765432',
        address: 'Test Address 123',
        answer: 'Test Answer',
    });

    userToken = JWT.sign({ _id: testUser._id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
});

describe('PUT /api/v1/auth/profile', () => {
    it('updates user name and return the updated user data', async () => {
        const updatedData = {
            name: 'Alena Updated',
        };

        const response = await request(app)
            .put('/api/v1/auth/profile')
            .set('Authorization', userToken)
            .send(updatedData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.updatedUser.name).toBe(updatedData.name);
    });

    it('updates user phone and return the updated user data', async () => {
        const updatedData = {
            phone: '91234567',
        };

        const response = await request(app)
            .put('/api/v1/auth/profile')
            .set('Authorization', userToken)
            .send(updatedData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.updatedUser.phone).toBe(updatedData.phone);
    });

    it('updates user address and return the updated user data', async () => {
        const updatedData = {
            address: 'New test address 999',
        };

        const response = await request(app)
            .put('/api/v1/auth/profile')
            .set('Authorization', userToken)
            .send(updatedData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.updatedUser.address).toBe(updatedData.address);
    });

    it('updates user email and return the updated user data', async () => {
        const updatedData = {
            email: 'newtestemail@email.com',
        };

        const response = await request(app)
            .put('/api/v1/auth/profile')
            .set('Authorization', userToken)
            .send(updatedData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.updatedUser.email).toBe(updatedData.email);
    });

    it('updates the password and hash it correctly', async () => {
        const newPassword = 'newPassword456';
        const profileUpdateWithPassword = {
            password: newPassword,
        };

        const response = await request(app)
            .put('/api/v1/auth/profile')
            .set('Authorization', userToken)
            .send(profileUpdateWithPassword);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        const userInDb = await User.findById(testUser._id);
        const isMatch = await bcrypt.compare(newPassword, userInDb.password);
        expect(isMatch).toBe(true);
    });

    it('returns 401 Unauthorized if no token is provided', async () => {
        const response = await request(app)
            .put('/api/v1/auth/profile')
            .send({ name: 'Unauthorized Update' });

        expect(response.status).toBe(401);
    });

    it('returns 400 Bad Request if password validation fails', async () => {
        const invalidData = { password: "123" };

        const response = await request(app)
            .put('/api/v1/auth/profile')
            .set('Authorization', userToken)
            .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Passsword is required and 6 character long');
    });

    it('returns same user data if empty request body', async () => {
        const invalidData = {};

        const response = await request(app)
            .put('/api/v1/auth/profile')
            .set('Authorization', userToken)
            .send(invalidData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.updatedUser.name).toBe(testUser.name);
    });
});