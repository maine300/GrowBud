# Quick Deploy Guide - SmartGrow

## Step 1: Create New GitHub Repository

1. Go to **github.com**
2. Click **"New"** (green button)
3. Repository name: `smartgrow-plant-monitor`
4. Make it **Public**
5. **Don't** initialize with README, .gitignore, or license
6. Click **"Create repository"**

## Step 2: Connect Your Code

After creating the repository, GitHub will show you commands. Run these:

```bash
# Remove old remote
git remote remove origin

# Add new remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/smartgrow-plant-monitor.git

# Push your code
git push -u origin main
```

## Step 3: Deploy to Render

1. Go to **render.com**
2. Click **"New +" → "Web Service"**
3. Connect your new repository: `YOUR_USERNAME/smartgrow-plant-monitor`
4. Settings:
   - Build Command: `npm install && npm run build`
   - Start Command: `node dist/index.js`
   - Environment Variables:
     - `NODE_ENV` = `production`
     - `DATABASE_URL` = (your PostgreSQL Internal Database URL)

## Your App Features
- Real-time plant monitoring
- Device controls (lights, fans, pumps)
- Plant management and photo tracking
- Care calendar with automated scheduling
- ESP32/ESP8266 hardware integration
- Professional growing schedules

Ready for deployment!