#!/bin/bash

# Render startup script for Plant Monitoring System
echo "🌱 Starting Plant Monitoring System..."

# Run database migrations first
echo "🗄️ Setting up database schema..."
if [ ! -z "$DATABASE_URL" ]; then
    echo "Running database migrations..."
    npm run db:push
    if [ $? -eq 0 ]; then
        echo "✅ Database schema ready!"
    else
        echo "⚠️ Database migration had issues, attempting to continue..."
    fi
else
    echo "⚠️ No DATABASE_URL found, skipping migrations"
fi

# Start the application
echo "🚀 Starting application server..."
npm start