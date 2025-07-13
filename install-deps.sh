#!/bin/bash

echo "🔧 Plesk-specific dependency installation script"

# Clean up any existing installations
echo "🧹 Cleaning up previous installations..."
rm -rf node_modules
rm -f package-lock.json

# Set Node.js version if using nodenv
if command -v nodenv &> /dev/null; then
    echo "📦 Setting Node.js version to 24..."
    nodenv local 24
fi

# Verify Node.js is available
echo "🔍 Checking Node.js environment..."
if command -v node &> /dev/null; then
    echo "✅ Node.js found: $(node --version)"
    echo "✅ npm found: $(npm --version)"
else
    echo "❌ Node.js not found in PATH"
    echo "🔧 Trying to locate Node.js..."
    
    # Try common Plesk Node.js paths
    if [ -f "/opt/plesk/node/24/bin/node" ]; then
        export PATH="/opt/plesk/node/24/bin:$PATH"
        echo "✅ Found Plesk Node.js: $(node --version)"
    elif [ -f "/opt/plesk/node/22/bin/node" ]; then
        export PATH="/opt/plesk/node/22/bin:$PATH"
        echo "✅ Found Plesk Node.js: $(node --version)"
    else
        echo "❌ Cannot locate Node.js. Please use Plesk Panel → Node.js interface instead."
        exit 1
    fi
fi

# Install dependencies with maximum compatibility flags
echo "📦 Installing dependencies..."
npm install \
    --production \
    --ignore-scripts \
    --no-optional \
    --no-audit \
    --no-fund \
    --prefer-offline \
    --legacy-peer-deps

if [ $? -eq 0 ]; then
    echo "✅ Basic installation successful"
    
    # Try to rebuild native modules safely
    echo "🔨 Rebuilding native modules..."
    npm rebuild --production 2>/dev/null || echo "⚠️  Some native modules may not have rebuilt, but this is usually fine"
    
    echo "🎉 Installation completed!"
    echo "📝 Your application should be ready to run"
else
    echo "❌ Installation failed"
    echo "💡 Try using Plesk Panel → Node.js → 'NPM Install' button instead"
    exit 1
fi 