import path from 'path';
import webpack from 'webpack';

// -----

// Create shared config variables
// ---
const DEBUG = !process.argv.includes('--release');
const VERBOSE = process.argv.includes('--verbose');

const clientRoot = path.resolve(__dirname, '../src/client');
const PATHS = {
  clientRoot: clientRoot,
  client: path.resolve(clientRoot, 'app.js'),
  build: path.resolve(__dirname, '../build')
};

const cssChunkNaming = '[name]__[local]___[hash:base64:5]';
const scssConfigIncludePaths = [ PATHS.clientRoot ];

// -----

// Server-side rendering of scss files
// ---
import hook from 'css-modules-require-hook';
import sass from 'node-sass';

// Implement a hook in node for `.scss`-imports that uses
// the same settings as the webpack config.
hook({
  extensions: [ '.scss' ],

  // Share naming-convention of `css-loader`
  generateScopedName: cssChunkNaming,

  // Process files with same settings as `sass-loader` and return css.
  preprocessCss: (cssFileData, cssFilePath) => {
    // Include any paths that are part of the config,
    // as well as the current path where css-file resides.
    let includePaths = [].concat(scssConfigIncludePaths);
    includePaths.push(path.dirname(cssFilePath));

    return sass.renderSync({
      data: cssFileData,
      includePaths: includePaths
    }).css;
  },
});

// -----

// Resulting webpack config
// ---
export default {
  devtool: 'source-map',

  entry: [
    'webpack-hot-middleware/client',
    PATHS.client
  ],

  output: {
    path: PATHS.build,
    filename: 'app.js',
    publicPath: '/'
  },

  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin()
  ],

  module: {
    loaders: [
      {
        test: /\.js?$/,
        loader: 'babel-loader',
        exclude: path.resolve(__dirname, '../node_modules')
      },
      {
        test: /\.scss$/,
        loaders: [
          'style-loader',
          'css-loader?modules&importLoaders=1&localIdentName=' + cssChunkNaming,
          'sass-loader'
        ]
      }
    ]
  },

  // `sass-loader`-specific config
  sassLoader: {
    includePaths: scssConfigIncludePaths
  },

  resolve: {
    modulesDirectories: [
      PATHS.clientRoot,
      'node_modules'
    ]
  },

  stats: {
    colors: true,
    reasons: DEBUG,
    hash: VERBOSE,
    version: VERBOSE,
    timings: true,
    chunks: VERBOSE,
    chunkModules: VERBOSE,
    cached: VERBOSE,
    cachedAssets: VERBOSE,
  }
};
