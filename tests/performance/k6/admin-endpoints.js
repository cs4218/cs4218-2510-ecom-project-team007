import { check, sleep } from 'k6';
import http from 'k6/http';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
import {
  randomIntBetween,
  randomItem,
  randomString,
} from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:6060';
const PRODUCT_COUNT = __ENV.PRODUCT_COUNT || 10000;

const testImage = open('../../fixtures/test-image.jpg', 'b');
const photo = http.file(testImage, 'test-image.jpg', 'image/jpeg');

let authToken;

export const options = {
  stages: [
    { duration: '20s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '20s', target: 25 },
    { duration: '30s', target: 25 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<5000'],
    'http_req_failed': ['rate<0.01'],
    'http_req_duration{endpoint:get-product}': ['p(95)<3000'],
    'http_req_duration{endpoint:create-product}': ['p(95)<2000'],
    'http_req_duration{endpoint:update-product}': ['p(95)<2000'],
    'http_req_duration{endpoint:delete-product}': ['p(95)<2000'],
    'http_req_duration{endpoint:all-orders}': ['p(95)<3000'],
    'http_req_duration{endpoint:order-status}': ['p(95)<2000'],
  },
};

function getAdminToken() {
  const body = JSON.stringify({
    email: 'testuser1@example.com',
    password: 'test123'
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(`${BASE_URL}/api/v1/auth/login`, body, params);

  if (res.status !== 200) {
    throw new Error('Failed to get admin token');
  }
  
  return res.json('token');
}

function getCategoryId() {
  const res = http.get(`${BASE_URL}/api/v1/category/get-category`);

  if (res.status !== 200) {
    throw new Error('Failed to fetch categories');
  }

  return res.json('category')[0]._id;
}

function getProducts(token) {
  const params = {
    headers: {
      'Authorization': token,
    },
  };

  const res = http.get(`${BASE_URL}/api/v1/product/get-product`, params);

  if (res.status !== 200) {
    throw new Error('Failed to fetch products');
  }

  return res.json('products');
}

function getOrderIds(token) {
  const params = {
    headers: {
      'Authorization': token,
    },
  };

  const res = http.get(`${BASE_URL}/api/v1/auth/all-orders`, params);

  if (res.status !== 200) {
    throw new Error('Failed to fetch orders');
  }

  return res.json().map(order => order._id);
}

export function setup() {
  const token = getAdminToken();
  const categoryId = getCategoryId();
  const products = getProducts(token);
  const orderIds = getOrderIds(token);

  return { token, categoryId, products, orderIds };
}

export default function ({ token, categoryId, products, orderIds }) {
  authToken = token;

  // Product tests
  testGetAllProducts();
  testCreateProduct(categoryId);
  testUpdateProduct(products);
  testDeleteProduct(categoryId);

  // Order tests
  testGetAllOrders();
  testUpdateOrderStatus(orderIds);

  sleep(randomIntBetween(0.5, 2.5));
}

function authParams(endpoint) {
  const params = {
    headers: {
      'Authorization': authToken,
    },
  };

  if (endpoint) {
    params.tags = { endpoint };
  }

  return params;
}

function createProductFormData(categoryId) {
  return {
    name: randomString(10),
    description: 'Test description',
    price: '99.99',
    category: categoryId,
    quantity: '10',
    shipping: 'true',
    photo,
  };
}

function createProduct(categoryId) {
  const res = http.post(
    `${BASE_URL}/api/v1/product/create-product`,
    createProductFormData(categoryId),
    authParams()
  );

  if (res.status !== 201) {
    return null;
  }

  return res.json('product')._id;
}

function testGetAllProducts() {
  const res = http.get(
    `${BASE_URL}/api/v1/product/get-product`,
    authParams('get-product')
  );

  check(res, {
    'get-product: status 200': (res) => res.status === 200,
  });
}

function testCreateProduct(categoryId) {
  const res = http.post(
    `${BASE_URL}/api/v1/product/create-product`,
    createProductFormData(categoryId),
    authParams('create-product')
  );

  check(res, {
    'create-product: status 201': (res) => res.status === 201,
  });
}

function testUpdateProduct(products) {
  const product = randomItem(products);

  const formData = {
    name: product.name,
    description: product.description,
    price: '199.99',
    category: product.category._id,
    quantity: '20',
    shipping: product.shipping,
    photo,
  };

  const res = http.put(
    `${BASE_URL}/api/v1/product/update-product/${product._id}`,
    formData,
    authParams('update-product')
  );

  check(res, {
    'update-product: status 200': (res) => res.status === 200,
  });
}

function testDeleteProduct(categoryId) {
  const productId = createProduct(categoryId);

  if (!productId) {
    return;
  }

  const res = http.del(
    `${BASE_URL}/api/v1/product/delete-product/${productId}`,
    null,
    authParams('delete-product')
  );

  check(res, {
    'delete-product: status 200': (res) => res.status === 200,
  });
}

function testGetAllOrders() {
  const res = http.get(
    `${BASE_URL}/api/v1/auth/all-orders`,
    authParams('all-orders')
  );

  check(res, {
    'all-orders: status 200': (res) => res.status === 200,
  });
}

function testUpdateOrderStatus(orderIds) {
  const orderId = randomItem(orderIds);
  const body = JSON.stringify({ status: 'Processing' });
  const params = {
    headers: {
      'Authorization': authToken,
      'Content-Type': 'application/json',
    },
    tags: { endpoint: 'order-status' },
  };

  const res = http.put(
    `${BASE_URL}/api/v1/auth/order-status/${orderId}`,
    body,
    params
  );

  check(res, {
    'order-status: status 200': (res) => res.status === 200,
  });
}

export function handleSummary(data) {
  const outputFile = `results/admin/summary-${PRODUCT_COUNT}.json`;

  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    [outputFile]: JSON.stringify(data, null, 2),
  };
}
