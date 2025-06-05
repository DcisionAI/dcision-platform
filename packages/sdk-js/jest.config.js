module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  cacheDirectory: '<rootDir>/../../.jestcache',
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  roots: ['<rootDir>/src'],
};