import { check, sleep } from 'k6';
import http from 'k6/http';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
import { randomIntBetween, randomItem } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { SEARCH_KEYWORDS } from '../utils/search-keywords.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:6060';
const PRODUCT_COUNT = __ENV.PRODUCT_COUNT || 10000;
const USER_COUNT = Math.floor(PRODUCT_COUNT / 50);

const PRICE_RANGES = [
  [1, 50],
  [50, 100],
  [100, 200],
  [200, 400],
  [400, 700], 
  [700, 1000],
];

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '2m', target: 20 },
    { duration: '30s', target: 50 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],
    'http_req_failed': ['rate<0.01'],
    'http_req_duration{endpoint:product-list}': ['p(95)<100'],
    'http_req_duration{endpoint:login}': ['p(95)<200'],
    'http_req_duration{endpoint:product-filters}': ['p(95)<100'],
    'http_req_duration{endpoint:search}': ['p(95)<200'],
    'http_req_duration{endpoint:product-category}': ['p(95)<200'],
    'http_req_duration{endpoint:get-product}': ['p(95)<100'],
  },
};

function getCategories() {
  const res = http.get(`${BASE_URL}/api/v1/category/get-category`);

  if (res.status !== 200) {
    throw new Error('Failed to fetch categories');
  }

  const categories = res.json('category');
  const categoryIds = categories.map(category => category._id);
  const categorySlugs = categories.map(category => category.slug);

  return { categoryIds, categorySlugs };
}

function getProductSlugs() {
  const res = http.get(`${BASE_URL}/api/v1/product/get-product`);

  if (res.status !== 200) {
    throw new Error('Failed to fetch products');
  }

  return res.json('products').map(product => product.slug);
}

export function setup() {
  const { categoryIds, categorySlugs } = getCategories();
  const productSlugs = getProductSlugs();
  
  return { categoryIds, categorySlugs, productSlugs };
}

export default function ({ categoryIds, categorySlugs, productSlugs }) {
  testProductList();
  testLogin();
  testProductFilters(categoryIds);
  testSearch();
  testProductCategory(categorySlugs);
  testGetSingleProduct(productSlugs);

  sleep(randomIntBetween(0.5, 2.5));
}

function testProductList() {
  const page = randomIntBetween(1, 10);
  
  const res = http.get(`${BASE_URL}/api/v1/product/product-list/${page}`, {
    tags: { endpoint: 'product-list' }
  });
  
  check(res, {
    'product-list: status 200': (res) => res.status === 200,
  });
}

function testLogin() {
  const id = randomIntBetween(1, USER_COUNT);
  const body = JSON.stringify({
    email: `testuser${id}@example.com`,
    password: 'test123'
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { endpoint: 'login' },
  };

  const res = http.post(`${BASE_URL}/api/v1/auth/login`, body, params);

  check(res, {
    'login: status 200': (res) => res.status === 200,
    'login: successful': (res) => res.json('success') === true,
  });
}

function testProductFilters(categoryIds) {
  const selectedCategories = new Set();
  const numCategories = randomIntBetween(1, categoryIds.length);

  while (selectedCategories.size < numCategories) {
    selectedCategories.add(randomItem(categoryIds));
  }

  const body = JSON.stringify({
    checked: [...selectedCategories],
    radio: randomItem(PRICE_RANGES),
    page: 1,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { endpoint: 'product-filters' },
  };

  const res = http.post(`${BASE_URL}/api/v1/product/product-filters`, body, params);

  check(res, {
    'product-filters: status 200': (res) => res.status === 200,
  });
}

function testSearch() {
  const keyword = randomItem(SEARCH_KEYWORDS);

  const res = http.get(`${BASE_URL}/api/v1/product/search/${keyword}`, {
    tags: { endpoint: 'search' }
  });

  check(res, {
    'search: status 200': (res) => res.status === 200,
  });
}

function testProductCategory(categorySlugs) {
  const slug = randomItem(categorySlugs);

  const res = http.get(`${BASE_URL}/api/v1/product/product-category/${slug}`, {
    tags: { endpoint: 'product-category' }
  });

  check(res, {
    'product-category: status 200': (res) => res.status === 200,
  });
}

function testGetSingleProduct(productSlugs) {
  const slug = randomItem(productSlugs);

  const res = http.get(`${BASE_URL}/api/v1/product/get-product/${slug}`, {
    tags: { endpoint: 'get-product' }
  });

  check(res, {
    'get-product: status 200': (res) => res.status === 200,
  });
}

export function handleSummary(data) {
  const outputFile = `results/public/summary-${PRODUCT_COUNT}.json`;

  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    [outputFile]: JSON.stringify(data, null, 2),
  };
}
