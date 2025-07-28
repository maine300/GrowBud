#!/bin/bash
# Render Deployment Script

echo "🚀 Preparing for Render deployment..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
    git branch -M main
fi

# Add all files
echo "📦 Adding files to git..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "Prepare for Render deployment - $(date)"

echo "✅ Ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git remote add origin YOUR_GITHUB_URL && git push -u origin main"
echo "2. Create PostgreSQL database on Render"
echo "3. Create web service on Render connected to your GitHub repo"
echo "4. Set environment variables (NODE_ENV=production, DATABASE_URL=your_db_url)"
echo "5. Update ESP code with new Render URL"
echo ""
echo "Your app will be available at: https://your-app-name.onrender.com"