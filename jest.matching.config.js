/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testEnvironment: 'node',
  // Detecta específicamente nuestro test de matching
  testMatch: ['<rootDir>/test/matching-system.test.ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 60000,
  setupFilesAfterEnv: [
    '<rootDir>/../test/setup/integration-setup.ts',
    '<rootDir>/../test/setup/test-logger.ts',
  ],
  globalSetup: '<rootDir>/../test/setup/global-setup.ts',
  globalTeardown: '<rootDir>/../test/setup/global-teardown.ts',
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  // Alias de módulos
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // No usar setupFiles porque corre antes de que Jest inyecte beforeAll/afterAll
  setupFiles: [],
};
