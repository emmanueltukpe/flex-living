#!/bin/bash

# Render.com build script for frontend
set -e

echo "🚀 Starting FlexLiving Reviews Frontend Build..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build React application
echo "🔨 Building React application..."
npm run build

# Verify build output
if [ ! -d "build" ]; then
    echo "❌ Build failed: build directory not found"
    exit 1
fi

if [ ! -f "build/index.html" ]; then
    echo "❌ Build failed: index.html not found in build"
    exit 1
fi

echo "✅ Frontend build completed successfully!"
echo "📁 Build output:"
ls -la build/

# Verify static assets
echo "🔍 Verifying static assets..."
if [ ! -d "build/static" ]; then
    echo "⚠️  Warning: static directory not found"
else
    echo "✅ Static assets found"
    ls -la build/static/
fi

# Check for required assets
required_files=("build/manifest.json" "build/favicon.ico")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "⚠️  Warning: $file not found (may be optional)"
    else
        echo "✅ Found: $file"
    fi
done

echo "🎉 Frontend ready for deployment!"
