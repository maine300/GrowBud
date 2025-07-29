#!/bin/bash
# Render Deployment Script for SmartGrow Plant Monitor

echo "Starting Render deployment process..."

# Build the application
echo "Building the application..."
npm install
npm run build

# Set production environment
export NODE_ENV=production

# Start the application
echo "Starting the application..."
npm start