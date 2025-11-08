import { faker } from '@faker-js/faker';
import _ from 'lodash';
import mongoose from 'mongoose';
import slugify from 'slugify';
import { hashPassword } from '#helpers/authHelper.js';
import categoryModel from '#models/categoryModel.js';
import orderModel from '#models/orderModel.js';
import productModel from '#models/productModel.js';
import userModel from '#models/userModel.js';

const CATEGORY_COUNT = 20;
const PRODUCT_COUNT = process.env.PRODUCT_COUNT || 10000;
const USER_COUNT = Math.floor(PRODUCT_COUNT / 50);
const ORDER_COUNT = USER_COUNT * 10;

const TARGET_BATCHES = 10;
const PRODUCT_BATCH_SIZE = Math.ceil(PRODUCT_COUNT / TARGET_BATCHES);
const USER_BATCH_SIZE = 100;
const ORDER_BATCH_SIZE = 500;

async function createCategories() {
  console.log(`Creating ${CATEGORY_COUNT} categories...`);
  const categoryIds = [];
  const names = faker.helpers.uniqueArray(faker.commerce.department, CATEGORY_COUNT);

  for (const name of names) {
    const category = await categoryModel.create({
      name,
      slug: slugify(name, { lower: true }),
    });
    categoryIds.push(category._id);
  }

  return categoryIds;
}

async function createProducts(categoryIds) {
  console.log(`Creating ${PRODUCT_COUNT} products (batch size: ${PRODUCT_BATCH_SIZE})...`);
  const productIds = [];

  for (let i = 0; i < PRODUCT_COUNT; i += PRODUCT_BATCH_SIZE) {
    const products = [];
    const remaining = Math.min(PRODUCT_BATCH_SIZE, PRODUCT_COUNT - i);

    for (let j = 0; j < remaining; j++) {
      const name = `${faker.commerce.productName()}-${i + j + 1}`;

      products.push({
        name,
        slug: slugify(name, { lower: true }),
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price()),
        category: _.sample(categoryIds),
        quantity: faker.number.int({ min: 1, max: 100 }),
        shipping: faker.datatype.boolean(),
      });
    }

    const insertedProducts = await productModel.insertMany(products);
    productIds.push(...insertedProducts.map(product => product._id));

    const totalCreated = i + remaining;
    const progress = ((totalCreated / PRODUCT_COUNT) * 100).toFixed(1);
    console.log(`  ${totalCreated}/${PRODUCT_COUNT} (${progress}%)`);
  }

  return productIds;
}

async function createUsers() {
  console.log(`\nCreating ${USER_COUNT} users (batch size: ${USER_BATCH_SIZE})...`);
  const hashedPassword = await hashPassword('test123');
  const userIds = [];

  for (let i = 0; i < USER_COUNT; i += USER_BATCH_SIZE) {
    const users = [];
    const remaining = Math.min(USER_BATCH_SIZE, USER_COUNT - i);

    for (let j = 0; j < remaining; j++) {
      users.push({
        name: faker.person.fullName(),
        email: `testuser${i + j + 1}@example.com`,
        password: hashedPassword,
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        answer: 'test',
        role: 1,
      });
    }

    const insertedUsers = await userModel.insertMany(users);
    userIds.push(...insertedUsers.map(user => user._id));

    const totalCreated = i + remaining;
    const progress = ((totalCreated / USER_COUNT) * 100).toFixed(1);
    console.log(`  ${totalCreated}/${USER_COUNT} (${progress}%)`);
  }

  return userIds;
}

async function createOrders(userIds, productIds) {
  console.log(`\nCreating ${ORDER_COUNT} orders (batch size: ${ORDER_BATCH_SIZE})...`);
  const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Canceled'];

  for (let i = 0; i < ORDER_COUNT; i += ORDER_BATCH_SIZE) {
    const orders = [];
    const remaining = Math.min(ORDER_BATCH_SIZE, ORDER_COUNT - i);

    for (let j = 0; j < remaining; j++) {
      orders.push({
        products: _.sampleSize(productIds, faker.number.int({ min: 1, max: 5 })),
        payment: {
          success: true,
        },
        buyer: _.sample(userIds),
        status: _.sample(statuses),
      });
    }

    await orderModel.insertMany(orders);

    const totalCreated = i + remaining;
    const progress = ((totalCreated / ORDER_COUNT) * 100).toFixed(1);
    console.log(`  ${totalCreated}/${ORDER_COUNT} (${progress}%)`);
  }
}

async function seedDatabase() {
  const startTime = Date.now();

  console.log('Connecting to MongoDB...');
  await mongoose.connect('mongodb://localhost:27017/ecom-volume-test');

  console.log('Clearing existing data...');
  await categoryModel.deleteMany({});
  await productModel.deleteMany({});
  await userModel.deleteMany({});
  await orderModel.deleteMany({});

  const categoryIds = await createCategories();
  const productIds = await createProducts(categoryIds);
  const userIds = await createUsers();
  await createOrders(userIds, productIds);

  const categoryCount = await categoryModel.countDocuments();
  const productCount = await productModel.countDocuments();
  const userCount = await userModel.countDocuments();
  const orderCount = await orderModel.countDocuments();
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\nDatabase seeded successfully!');
  console.log(`  Categories: ${categoryCount}`);
  console.log(`  Products: ${productCount}`);
  console.log(`  Users: ${userCount}`);
  console.log(`  Orders: ${orderCount}`);
  console.log(`  Total time: ${totalTime}s`);
}

try {
  await seedDatabase();
} catch (error) {
  console.error('Failed to seed database', error);
} finally {
  await mongoose.disconnect();
}
