#!/bin/bash

# GitHub + Vercel Deployment Script
# This script helps you deploy your Node.js API to GitHub and prepare for Vercel

echo "🚀 Starting deployment process..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created. Please update it with your actual values."
    echo "   Edit the .env file and then run this script again."
    exit 1
fi

# Add all files
echo "📦 Adding files to Git..."
git add .

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "ℹ️  No changes to commit."
else
    echo "💾 Committing changes..."
    git commit -m "Deploy to GitHub and Vercel - $(date)"
fi

# Check if remote origin exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 Please add your GitHub repository as remote origin:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/hospient-api.git"
    echo ""
    echo "   Then run this script again."
    exit 1
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ GitHub deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://vercel.com"
echo "2. Sign up/Login with your GitHub account"
echo "3. Click 'New Project'"
echo "4. Import your GitHub repository"
echo "5. Configure environment variables in Vercel dashboard"
echo "6. Deploy!"
echo ""
echo "📖 See VERCEL_DEPLOYMENT.md for detailed instructions." 