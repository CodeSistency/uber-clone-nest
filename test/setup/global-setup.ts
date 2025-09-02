import { execSync } from 'child_process';

// Global setup for integration tests
export default async function globalSetup(): Promise<void> {
  try {
    console.log('🚀 Setting up integration test environment...');

    // Create test database if it doesn't exist
    console.log('📦 Ensuring test database exists...');

    // Run Prisma migrations for test database
    console.log('🗄️ Running Prisma migrations...');
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
      },
    });

    // Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    // Seed test data
    console.log('🌱 Seeding test data...');
    execSync('npm run db:seed', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
      },
    });

    console.log('✅ Integration test setup complete!');
  } catch (error) {
    console.error('❌ Failed to setup integration test environment:', error);
    throw error;
  }
}
