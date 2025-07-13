#!/bin/bash

# Gastlook API Deployment Script for Plesk Server

echo "🚀 Starting Gastlook API deployment..."

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p uploads

# Set proper permissions
echo "🔒 Setting permissions..."
chmod 755 uploads
chmod 755 logs

# Install production dependencies
echo "📦 Installing dependencies..."
npm install --production

# Run database migrations (if using Sequelize CLI)
echo "🗄️ Running database migrations..."
if [ -f "node_modules/.bin/sequelize" ]; then
    npx sequelize-cli db:migrate
else
    echo "Sequelize CLI not found, skipping migrations"
fi

# Start the application with PM2 (if available)
echo "🔄 Starting application..."
if command -v pm2 &> /dev/null; then
    pm2 stop gastlook-api 2>/dev/null || true
    pm2 start ecosystem.config.js --env production
    pm2 save
    echo "✅ Application started with PM2"
else
    echo "PM2 not found, starting with node..."
    nohup node src/index.js > logs/app.log 2>&1 &
    echo "✅ Application started in background"
fi

echo "🎉 Deployment completed!"
echo "📝 Check logs in the 'logs' directory"
echo "🌐 Your API should be available at your configured domain" 