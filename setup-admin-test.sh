#!/bin/bash

# 🚀 Setup script for Admin System Testing
echo "🚀 Setting up Admin System for testing..."
echo "=========================================="

# Check if PostgreSQL is running
echo "📊 Checking PostgreSQL..."
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    echo "   Try: sudo systemctl start postgresql"
    exit 1
fi

echo "✅ PostgreSQL is running"

# Create database if it doesn't exist
echo "🗄️  Creating database..."
createdb uber_clone_db 2>/dev/null || echo "Database already exists or creation failed"

# Apply migrations
echo "📝 Applying database migrations..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
    echo "❌ Migration failed. Trying to reset and migrate..."
    npx prisma migrate reset --force --skip-generate
    npx prisma migrate deploy
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Seed the database
echo "🌱 Seeding database..."
npm run db:seed

if [ $? -ne 0 ]; then
    echo "❌ Seeding failed. Check database connection and try again."
    exit 1
fi

echo "✅ Database setup complete!"
echo ""
echo "🎯 Admin System Test Credentials:"
echo "=================================="
echo "Super Admin: superadmin@uberclone.com / SuperAdmin123!"
echo "Admin: admin@uberclone.com / Admin123!"
echo "Moderator: moderator@uberclone.com / Moderator123!"
echo "Support: support@uberclone.com / Support123!"
echo ""
echo "🚀 You can now test the admin login at:"
echo "   POST /admin/auth/login"
echo ""
echo "🔗 For testing endpoints, use the access token in the Authorization header:"
echo "   Authorization: Bearer <access_token>"
echo ""
echo "📋 Next steps:"
echo "1. Start the application: npm run start:dev"
echo "2. Test login endpoint with admin credentials"
echo "3. Use the token to access protected admin endpoints"
