export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which tests to run
  testMatch: [
    "<rootDir>/config/*.test.js",
    "<rootDir>/controllers/*.test.js",
    "<rootDir>/helpers/*.test.js",
    "<rootDir>/middlewares/*.test.js",
    "<rootDir>/models/*.test.js",
    "<rootDir>/routes/*.test.js",
    "<rootDir>/tests/integration/**/*.test.js",
  ],

  // jest code coverage
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 75,
    },
  },
};
