#!/bin/bash

# Database setup script for Vercel deployment
echo "🗄️  Setting up database for production..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    exit 1
fi

echo "📡 Database URL found (production)"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Deploy migrations
echo "🚀 Deploying database migrations..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "✅ Database setup completed successfully!"
else
    echo "❌ Database setup failed"
    exit 1
fi