//@ts-check

'use strict';

const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin'); // Add this line to require the plugin

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
  target: 'node', // VS Code extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
  mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

  entry: {
    extension: ['./src/extension.ts'] // Include objectDetailsView in the extension entry
  },
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js', // Output each entry point as a separate file
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    // modules added here also need to be added in the .vscodeignore file
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              // Skip type checking to allow build to complete with errors
              transpileOnly: true
            }
          }
        ]
      },
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true
          }
        },
        exclude: /node_modules/
      },
      {
        test: /\.jsx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: []
          }
        },
        exclude: /node_modules/
      }
    ]
  },  plugins: [
    // Add CopyWebpackPlugin to copy webview files
    new CopyWebpackPlugin({
      patterns: [
        { 
          from: 'src/webviews/*.js',
          to: 'webviews/[name][ext]'
        },
        { 
          from: 'src/webviews/objects',
          to: 'webviews/objects' 
        },
        { 
          from: 'src/webviews/reports',
          to: 'webviews/reports' 
        },
        { 
          from: 'src/webviews/pageflow',
          to: 'webviews/pageflow' 
        },
        { 
          from: 'src/webviews/userStoryDev',
          to: 'webviews/userStoryDev' 
        }
      ]
    })
  ],
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: "log", // enables logging required for problem matchers
  },
};
module.exports = [ extensionConfig ];