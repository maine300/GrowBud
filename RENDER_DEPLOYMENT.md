# Deploying to Render

## Overview
Your plant monitoring app can be deployed to Render as an alternative to Replit. Render offers free hosting with PostgreSQL database support.

## Prerequisites
- GitHub account (to connect your repository)
- Render account (free at render.com)

## Step 1: Prepare Your Repository

### Push to GitHub
1. Create a new repository on GitHub
2. Push your plant monitoring code to the repository:
```bash
git init
git add .
git commit -m "Initial plant monitoring app"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo-name.git
git push -u origin main
```

## Step 2: Database Setup

### Create PostgreSQL Database on Render
1. Go to render.com and sign in
2. Click "New +" → "PostgreSQL"
3. Name: `plant-monitoring-db`
4. Database Name: `plant_monitoring`
5. User: `plant_user`
6. Plan: Free
7. Click "Create Database"
8. Save the connection string (you'll need it)

## Step 3: Web Service Setup

### Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure settings:
   - **Name**: `plant-monitoring-app`
   - **Environment**: `Node`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### Environment Variables
Add these environment variables:
- **NODE_ENV**: `production`
- **DATABASE_URL**: (use the connection string from your PostgreSQL database)

## Step 4: Update ESP Code

After deployment, update your ESP code with the new Render URL:
```cpp
const char* serverURL = "https://your-app-name.onrender.com";
```

## Step 5: File Storage Consideration

### Important Note
Render's free tier has ephemeral storage, meaning uploaded photos may be lost on restarts.

### Solutions:
1. **Use cloud storage** (AWS S3, Cloudinary, etc.)
2. **Store photos in database** as base64 (not recommended for large files)
3. **Accept photo loss** on restarts (simplest for testing)

## Render vs Replit Comparison

| Feature | Replit | Render |
|---------|---------|---------|
| **Setup Speed** | Very Fast | Moderate |
| **Database** | Built-in Neon | Separate PostgreSQL |
| **File Storage** | Persistent | Ephemeral (free tier) |
| **Custom Domain** | Paid | Free |
| **Auto-sleep** | Yes | Yes (free tier) |
| **Build Time** | Fast | Moderate |
| **GitHub Integration** | Optional | Required |

## Deployment Steps Summary

1. **Push code to GitHub**
2. **Create PostgreSQL database on Render**
3. **Create web service connected to GitHub**
4. **Set environment variables**
5. **Update ESP code with new URL**
6. **Test sensor data and device control**

## Troubleshooting

### Common Issues:

**Build fails:**
- Check that all dependencies are in package.json
- Verify build command is correct
- Look at build logs for specific errors

**Database connection fails:**
- Verify DATABASE_URL is correct
- Check database is running
- Ensure connection string format is correct

**ESP can't connect:**
- Verify new Render URL in ESP code
- Check if app is sleeping (free tier sleeps after inactivity)
- Test API endpoints manually first

**File uploads don't work:**
- Remember Render free tier has ephemeral storage
- Consider using cloud storage service
- Or store small images in database

### Performance Tips:
- Use environment variables for sensitive data
- Enable gzip compression
- Optimize images before upload
- Use database connection pooling

Your plant monitoring system will work the same way on Render, just with a different URL for your ESP devices to connect to!