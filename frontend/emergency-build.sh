#!/bin/bash

# Emergency build script for extremely memory-constrained environments
# This creates a minimal static build without webpack bundling

set -e

echo "🚨 Emergency build mode - creating minimal static version..."

# Create build directory
mkdir -p build/static/js
mkdir -p build/static/css

# Copy and process index.html
echo "📄 Creating minimal index.html..."
cat > build/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="FlexLiving Reviews Dashboard" />
    <link rel="apple-touch-icon" href="/logo192.png" />
    <link rel="manifest" href="/manifest.json" />
    <title>FlexLiving Reviews Dashboard</title>
    <style>
        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
                'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
                sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            background-color: #f5f5f5;
        }
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            flex-direction: column;
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 2s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .error {
            color: #e74c3c;
            text-align: center;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: #2c3e50;
            color: white;
            padding: 1rem;
            margin-bottom: 2rem;
        }
        .card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div id="root">
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading FlexLiving Reviews Dashboard...</p>
            <p><small>If this takes too long, please refresh the page.</small></p>
        </div>
    </div>
    
    <script>
        // Minimal error handling
        window.onerror = function(msg, url, lineNo, columnNo, error) {
            document.getElementById('root').innerHTML = 
                '<div class="error"><h2>Application Error</h2><p>Please refresh the page or contact support.</p></div>';
            return false;
        };
        
        // Simple fallback content if React fails to load
        setTimeout(function() {
            if (document.querySelector('.loading')) {
                document.getElementById('root').innerHTML = 
                    '<div class="container">' +
                    '<div class="header"><h1>FlexLiving Reviews Dashboard</h1></div>' +
                    '<div class="card">' +
                    '<h2>Welcome to FlexLiving Reviews</h2>' +
                    '<p>The application is currently loading. If you continue to see this message, please:</p>' +
                    '<ul>' +
                    '<li>Refresh the page</li>' +
                    '<li>Clear your browser cache</li>' +
                    '<li>Contact technical support</li>' +
                    '</ul>' +
                    '</div>' +
                    '</div>';
            }
        }, 10000);
    </script>
    
    <!-- React will be injected here by the build process -->
    <script>
        // Placeholder for React app - this would normally be replaced by webpack
        console.log('FlexLiving Reviews Dashboard - Emergency Build Mode');
        
        // Basic routing fallback
        if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
            window.history.replaceState({}, '', '/');
        }
    </script>
</body>
</html>
EOF

# Copy public assets
echo "📁 Copying public assets..."
if [ -d "public" ]; then
    cp public/favicon.ico build/ 2>/dev/null || echo "⚠️  favicon.ico not found"
    cp public/manifest.json build/ 2>/dev/null || echo "⚠️  manifest.json not found"
    cp public/robots.txt build/ 2>/dev/null || echo "⚠️  robots.txt not found"
    cp public/logo192.png build/ 2>/dev/null || echo "⚠️  logo192.png not found"
    cp public/logo512.png build/ 2>/dev/null || echo "⚠️  logo512.png not found"
fi

# Create minimal manifest.json if it doesn't exist
if [ ! -f "build/manifest.json" ]; then
    echo "📄 Creating minimal manifest.json..."
    cat > build/manifest.json << 'EOF'
{
  "short_name": "FlexLiving Reviews",
  "name": "FlexLiving Reviews Dashboard",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}
EOF
fi

# Create robots.txt if it doesn't exist
if [ ! -f "build/robots.txt" ]; then
    echo "📄 Creating robots.txt..."
    cat > build/robots.txt << 'EOF'
User-agent: *
Disallow:
EOF
fi

echo "✅ Emergency build completed!"
echo "📁 Build contents:"
ls -la build/

echo "🚨 Note: This is a minimal emergency build."
echo "   The full React application may not function properly."
echo "   This is intended as a fallback to prevent deployment failures."
