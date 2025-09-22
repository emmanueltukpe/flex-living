#!/usr/bin/env node

/**
 * Minimal build script for Render.com with aggressive memory optimizations
 * This script bypasses some of the memory-intensive features of react-scripts
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting minimal build for Render.com...');

// Set memory-optimized environment variables
process.env.GENERATE_SOURCEMAP = 'false';
process.env.INLINE_RUNTIME_CHUNK = 'false';
process.env.IMAGE_INLINE_SIZE_LIMIT = '0';
process.env.NODE_OPTIONS = '--max-old-space-size=3072 --optimize-for-size';

// Disable TypeScript type checking during build
process.env.TSC_COMPILE_ON_ERROR = 'true';
process.env.ESLINT_NO_DEV_ERRORS = 'true';

// Create a minimal webpack config override
const webpackConfigPath = path.join(__dirname, 'webpack.config.minimal.js');
const webpackConfig = `
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'static/js/[name].[contenthash:8].js',
    chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',
    publicPath: '/',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\\.(ts|tsx)$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true, // Skip type checking for speed
            compilerOptions: {
              noEmit: false,
            },
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'static/media/[name].[hash:8][ext]',
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
    }),
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash:8].css',
      chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      maxSize: 200000, // Smaller chunks
      cacheGroups: {
        vendor: {
          test: /[\\\\/]node_modules[\\\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
    minimize: true,
  },
  performance: {
    maxAssetSize: 500000,
    maxEntrypointSize: 500000,
  },
};
`;

try {
  // Write minimal webpack config
  fs.writeFileSync(webpackConfigPath, webpackConfig);
  console.log('✅ Created minimal webpack config');

  // Try the standard build first with optimizations
  console.log('🔨 Attempting optimized react-scripts build...');
  
  try {
    execSync('npm run build:render', { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.log('⚠️  Standard build failed, trying fallback...');
    
    // Fallback: Use webpack directly with minimal config
    console.log('🔨 Using minimal webpack build...');
    execSync('npx webpack --config webpack.config.minimal.js', { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log('✅ Minimal build completed!');
  }

  // Copy public assets
  console.log('📁 Copying public assets...');
  const publicDir = path.join(__dirname, 'public');
  const buildDir = path.join(__dirname, 'build');
  
  const publicFiles = ['flex.webp', 'manifest.json', 'robots.txt', 'logo192.png', 'logo512.png'];
  publicFiles.forEach(file => {
    const src = path.join(publicDir, file);
    const dest = path.join(buildDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`Copied ${file}`);
    }
  });

  console.log('🎉 Build process completed successfully!');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} finally {
  // Clean up
  if (fs.existsSync(webpackConfigPath)) {
    fs.unlinkSync(webpackConfigPath);
  }
}
