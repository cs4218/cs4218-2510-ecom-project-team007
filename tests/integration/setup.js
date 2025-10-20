import JWT from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import userModel from '../../models/userModel.js';
import { hashPassword } from '../../helpers/authHelper.js';

let mongoServer;

export const connectTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
};

export const closeTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

export const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
};

export const createTestUser = async (role = 1, email = 'admin@test.com') => {
  const hashedPassword = await hashPassword('test123');

  const user = await userModel.create({
    name: 'Test User',
    email: email,
    password: hashedPassword,
    phone: '1234567890',
    address: 'Test Address',
    answer: 'test',
    role: role,  // 0 = regular user, 1 = admin
  });

  const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  return { user, token };
};
