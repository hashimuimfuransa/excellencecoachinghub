module.exports = function override(config, env) {
  // Find HtmlWebpackPlugin and disable minification
  const htmlWebpackPlugin = config.plugins.find(
    plugin => plugin.constructor.name === 'HtmlWebpackPlugin'
  );
  
  if (htmlWebpackPlugin && htmlWebpackPlugin.options) {
    // Disable HTML minification completely
    htmlWebpackPlugin.options.minify = false;
  }
  
  // Disable ESLint plugin in production builds
  if (env === 'production') {
    config.plugins = config.plugins.filter(
      plugin => plugin.constructor.name !== 'ESLintWebpackPlugin'
    );
  }
  
  return config;
};