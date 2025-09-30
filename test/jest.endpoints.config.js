module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: [
    '**/test/complete-endpoints.integration.spec.ts',
    '**/*endpoints*.integration.spec.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.d.ts',
    '!src/main.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: './coverage/endpoints',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  setupFilesAfterEnv: ['<rootDir>/test/setup/integration-setup.ts'],
  testTimeout: 60000, // 60 seconds for endpoint tests
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  globalSetup: '<rootDir>/test/setup/global-setup.ts',
  globalTeardown: '<rootDir>/test/setup/global-teardown.ts',
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './test/reports',
      outputName: 'endpoints-test-results.xml',
      suiteName: 'Uber Clone API Endpoints Tests'
    }]
  ]
};
