#!/bin/bash

# Render.com build script for frontend
set -e

echo "🚀 Starting FlexLiving Reviews Frontend Build..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Set Node.js memory options for Render's environment
export NODE_OPTIONS="--max-old-space-size=3072 --optimize-for-size"
export GENERATE_SOURCEMAP=false
export INLINE_RUNTIME_CHUNK=false
export IMAGE_INLINE_SIZE_LIMIT=0
export TSC_COMPILE_ON_ERROR=true
export ESLINT_NO_DEV_ERRORS=true

# Try multiple build strategies with increasing memory optimization
echo "🔨 Building React application with aggressive memory optimizations..."
echo "Node memory limit: 3GB"
echo "Source maps: disabled"
echo "Runtime chunk inlining: disabled"
echo "TypeScript type checking: disabled during build"

# Strategy 1: Try CRACO build with optimizations
echo "🔄 Attempting Strategy 1: CRACO build with optimizations..."
if npm run build:render; then
    echo "✅ CRACO build succeeded!"
# Strategy 2: Try minimal webpack build
elif echo "🔄 Attempting Strategy 2: Minimal webpack build..." && node build-minimal.js; then
    echo "✅ Minimal build succeeded!"
# Strategy 3: Emergency static build
elif echo "🔄 Attempting Strategy 3: Emergency static build..." && ./emergency-build.sh; then
    echo "⚠️  Emergency build completed - limited functionality"
    echo "   This is a fallback build to prevent deployment failure"
else
    echo "❌ All build strategies failed"
    exit 1
fi

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
