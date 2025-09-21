#!/bin/bash

# Render.com build script for backend
set -e

echo "🚀 Starting FlexLiving Reviews Backend Build..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Verify build output
if [ ! -d "dist" ]; then
    echo "❌ Build failed: dist directory not found"
    exit 1
fi

if [ ! -f "dist/server.js" ]; then
    echo "❌ Build failed: server.js not found in dist"
    exit 1
fi

echo "✅ Backend build completed successfully!"
echo "📁 Build output:"
ls -la dist/

# Verify required files
echo "🔍 Verifying required files..."
required_files=("package.json" "openapi.yaml")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Required file missing: $file"
        exit 1
    fi
done

echo "✅ All required files present"
echo "🎉 Backend ready for deployment!"
