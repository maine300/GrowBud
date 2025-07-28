#!/bin/bash

# Render deployment script for Plant Monitoring System
echo "🌱 Starting Plant Monitoring System deployment..."

# Install all dependencies including dev dependencies for build
echo "📦 Installing dependencies..."
npm ci --include=dev

# Build the application first
echo "🔨 Building application..."
npm run build

# Verify build output
if [ -d "dist" ] && [ -f "dist/server/index.js" ] && [ -d "dist/public" ]; then
    echo "✅ Build completed successfully!"
else
    echo "❌ Build failed - missing output files"
    exit 1
fi

# Run database migrations after build (for production deployment)
echo "🗄️ Setting up database..."
if [ ! -z "$DATABASE_URL" ]; then
    echo "Running database migrations..."
    npm run db:push || echo "⚠️ Database migration failed, but continuing..."
fi

echo "🚀 Deployment preparation complete!"