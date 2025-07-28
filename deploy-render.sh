#!/bin/bash

# Render deployment script for Plant Monitoring System
echo "🌱 Starting Plant Monitoring System deployment..."

# Install all dependencies including dev dependencies for build
echo "📦 Installing dependencies..."
npm ci --include=dev

# Run database migrations if needed
echo "🗄️ Setting up database..."
if [ ! -z "$DATABASE_URL" ]; then
    npm run db:push
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Verify build output
if [ -d "dist" ] && [ -f "dist/server/index.js" ] && [ -d "dist/public" ]; then
    echo "✅ Build completed successfully!"
else
    echo "❌ Build failed - missing output files"
    exit 1
fi

echo "🚀 Deployment preparation complete!"