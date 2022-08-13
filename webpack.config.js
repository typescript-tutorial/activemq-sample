const webpack = require('webpack'),
  path = require('path'),
  UglifyJsPlugin = require('uglifyjs-webpack-plugin'),
  BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  target: 'node',
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
        }
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new UglifyJsPlugin({
      test: /\.js($|\?)/i
    }),
    new webpack.IgnorePlugin({ resourceRegExp: /^pg-native$/ }),
    new BundleAnalyzerPlugin()
  ],
};
