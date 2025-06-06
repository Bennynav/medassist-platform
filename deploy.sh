#!/bin/bash

echo "🚀 Deploying MedAssist Platform to GitHub..."

# Add all files
git add .

# Commit with timestamp
git commit -m "Deploy MedAssist platform - $(date)"

# Push to GitHub
git push origin main

echo "✅ Successfully pushed to GitHub!"
echo ""
echo "Next steps:"
echo "1. Go to railway.app and deploy from your GitHub repo"
echo "2. Add the environment variables from backend/.env.example"
echo "3. Go to vercel.com and deploy the frontend"
echo "4. Update REACT_APP_BACKEND_URL with your Railway URL"
echo ""
echo "🎉 Your MedAssist platform will be live!"