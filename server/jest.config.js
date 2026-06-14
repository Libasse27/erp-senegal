module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/seeds/**',
    '!src/config/logger.js',
  ],
  coverageThreshold: {
    global: {
      branches: 25,
      functions: 40,
      lines: 50,
      statements: 48,
    },
  },
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 30000,
};
