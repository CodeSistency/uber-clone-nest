/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testEnvironment: 'node',
  testRegex: '.matching.test.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000, // 30 segundos para tests complejos
  setupFilesAfterEnv: ['<rootDir>/../test/setup/integration-setup.ts'],
  globalSetup: '<rootDir>/../test/setup/global-setup.ts',
  globalTeardown: '<rootDir>/../test/setup/global-teardown.ts',
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  // Configuración específica para tests de matching
  testPathPattern: ['test/matching-system.test.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Configuración de logging para tests
  setupFiles: ['<rootDir>/../test/setup/test-logger.ts'],
};
