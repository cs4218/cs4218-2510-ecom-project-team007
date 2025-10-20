import mongoose from 'mongoose';
import { hashPassword } from '../../helpers/authHelper';

export default async function globalSetup() {
  await mongoose.connect('mongodb://localhost:27017/ecom-e2e-test');

  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }

  const hashedPassword = await hashPassword('admin123');

  await mongoose.connection.collection('users').insertOne({
    name: 'Test Admin',
    email: 'admin@test.com',
    password: hashedPassword,
    phone: '1234567890',
    address: 'Test Address',
    answer: 'test',
    role: 1,
  });

  await mongoose.disconnect();
}
