# Step-by-Step Render Deployment - SmartGrow

## Phase 1: GitHub Setup (5 minutes)

### 1. Create GitHub Repository
1. Go to github.com and create a new repository
2. Name it: `smartgrow-plant-monitor`
3. Make it public
4. Don't initialize with README (we'll push existing code)

### 2. Push Your Code
Run these commands in your terminal:
```bash
git init
git add .
git commit -m "SmartGrow Plant Monitor - Ready for Render"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/smartgrow-plant-monitor.git
git push -u origin main
```

## Phase 2: Render Database Setup (3 minutes)

### 1. Create PostgreSQL Database
1. Go to render.com and sign in
2. Click "New +" → "PostgreSQL"
3. Settings:
   - Name: `smartgrow-database`
   - Database Name: `plant_monitoring`
   - User: `plant_user`
   - Region: Choose closest to you
   - Plan: **Free**
4. Click "Create Database"
5. **IMPORTANT**: Wait for status to show "Available" (takes 2-3 minutes)
6. Copy the **Internal Database URL** (starts with postgresql://internal-...)

## Phase 3: Web Service Setup (5 minutes)

### 1. Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub account
3. Select your `smartgrow-plant-monitor` repository
4. Settings (USE EXACTLY THESE):
   - Name: `smartgrow-app`
   - Environment: `Node`
   - Region: Same as your database
   - Branch: `main`
   - Root Directory: (leave blank)
   - Build Command: `npm install && npm run build`
   - Start Command: `node dist/index.js`
   - Auto-Deploy: Yes

### 2. Environment Variables
In the Environment section, add:
- Key: `NODE_ENV` | Value: `production`
- Key: `DATABASE_URL` | Value: (paste the Internal Database URL from step 2.6)

### 3. Deploy
1. Click "Create Web Service"
2. Wait for build to complete (5-10 minutes)
3. Check build logs for success

## Phase 4: Verification (2 minutes)

### 1. Test Your App
1. Click on your app URL (e.g., https://smartgrow-app.onrender.com)
2. Verify dashboard loads
3. Check that sensor data appears
4. Test device controls
5. Try adding a plant

### 2. Check Logs
If anything doesn't work:
1. Go to "Logs" tab in Render dashboard
2. Look for any error messages
3. Should see: "serving on port [NUMBER]"

## Success Indicators

### Build Success
```
✅ Dependencies installed
✅ Vite build completed
✅ ESBuild bundle created
✅ Deploy complete
```

### Runtime Success
```
✅ App starts without errors
✅ Database connection established
✅ Dashboard loads correctly
✅ API endpoints respond
```

## If Something Goes Wrong

### Build Fails
- Check build logs for specific error
- Verify all dependencies are in package.json
- Try building locally first: `npm install && npm run build`

### App Won't Start
- Check environment variables are set correctly
- Verify DATABASE_URL is the Internal URL
- Look at runtime logs for error details

### Database Issues
- Ensure database status is "Available"
- Double-check DATABASE_URL is copied correctly
- Wait a few minutes and try again

## After Successful Deployment

### 1. Update ESP/IoT Code
Replace the server URL in your ESP code:
```cpp
const char* serverURL = "https://smartgrow-app.onrender.com";
```

### 2. Test IoT Integration
- Upload updated ESP code
- Verify sensor data appears in your app
- Test device controls from the app

Your SmartGrow plant monitoring system will be live and accessible from anywhere!

## Deployment Timeline
- GitHub setup: 5 minutes
- Database creation: 3 minutes  
- Web service setup: 5 minutes
- Build and deploy: 5-10 minutes
- **Total: 15-20 minutes**

Ready to start? Let's begin with Phase 1!