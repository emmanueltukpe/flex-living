const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Memory optimizations for Render.com builds
      if (env === 'production') {
        // Reduce memory usage by limiting parallel processing
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
                maxSize: 244000, // Smaller chunks to reduce memory usage
              },
              common: {
                name: 'common',
                minChunks: 2,
                chunks: 'all',
                maxSize: 244000,
              },
            },
          },
          // Reduce memory usage during minification
          minimizer: webpackConfig.optimization.minimizer.map(plugin => {
            if (plugin.constructor.name === 'TerserPlugin') {
              plugin.options.parallel = 1; // Reduce parallel processing
              plugin.options.terserOptions = {
                ...plugin.options.terserOptions,
                compress: {
                  ...plugin.options.terserOptions?.compress,
                  passes: 1, // Reduce optimization passes
                },
              };
            }
            return plugin;
          }),
        };

        // Disable source maps completely
        webpackConfig.devtool = false;

        // Reduce bundle analyzer and other memory-intensive plugins
        webpackConfig.plugins = webpackConfig.plugins.filter(plugin => {
          return !plugin.constructor.name.includes('BundleAnalyzer');
        });
      }

      return webpackConfig;
    },
  },
  // Disable TypeScript type checking during build to save memory
  typescript: {
    enableTypeChecking: false,
  },
};
