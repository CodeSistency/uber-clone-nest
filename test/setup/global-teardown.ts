import { execSync } from 'child_process';

// Global teardown for integration tests
export default async function globalTeardown(): Promise<void> {
  try {
    console.log('🧹 Cleaning up integration test environment...');

    // Reset test database
    console.log('🗑️ Resetting test database...');
    execSync('npx prisma migrate reset --force --skip-generate', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
      },
    });

    console.log('✅ Integration test cleanup complete!');
  } catch (error) {
    console.error('❌ Failed to cleanup integration test environment:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}
