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

  const hashedUserPassword = await hashPassword('user123');

  await mongoose.connection.collection('users').insertOne({
    name: 'Test User',
    email: 'user@test.com',
    password: hashedUserPassword,
    phone: '1234567890',
    address: 'Test Address',
    answer: 'test',
    role: 1,
  });

  const category = await mongoose.connection.collection('categories').insertOne({
    name: "testcategory", slug: "testcategory"
  });

  await mongoose.connection.collection('products').insertMany([
    {
      name: 'Product 1', slug: 'Product-1', description: 'This is a test product 1',
      price: 1.99, category: category.insertedId, quantity: 5, shipping: true
    },
    {
      name: 'Product 2', slug: 'Product-2', description: 'This is a test product 2',
      price: 2.99, category: category.insertedId, quantity: 5, shipping: true
    },
    {
      name: 'Product 3', slug: 'Product-3', description: 'This is a test product 3',
      price: 3.99, category: category.insertedId, quantity: 5, shipping: true
    },
    {
      name: 'Product 4', slug: 'Product-4', description: 'This is a test product 4',
      price: 4.99, category: category.insertedId, quantity: 5, shipping: true
    },
    {
      name: 'Product 5', slug: 'Product-5', description: 'This is a test product 5',
      price: 5.99, category: category.insertedId, quantity: 5, shipping: true
    },
    {
      name: 'Product 6', slug: 'Product-6', description: 'This is a test product 6',
      price: 6.99, category: category.insertedId, quantity: 5, shipping: true
    },
    {
      name: 'Product 7', slug: 'Product-7', description: 'This is a test product 7',
      price: 7.99, category: category.insertedId, quantity: 5, shipping: true
    },
    {
      name: 'Product 8', slug: 'Product-8', description: 'This is a test product 8',
      price: 8.99, category: category.insertedId, quantity: 5, shipping: true
    },
    {
      name: 'Product 9', slug: 'Product-9', description: 'This is a test product 9',
      price: 9.99, category: category.insertedId, quantity: 5, shipping: true
    }
  ]);

  await mongoose.disconnect();
}
