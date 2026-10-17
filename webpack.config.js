const Path = require('path');
const { JavascriptWebpackConfig, CssWebpackConfig } = require('@silverstripe/webpack-config');
const TerserPlugin = require('terser-webpack-plugin');

const ENV = process.env.NODE_ENV;
const PATHS = {
  ROOT: Path.resolve(),
  SRC: Path.resolve('client/src'),
  DIST: Path.resolve('client/dist'),
};

const config = [
  // Main JS bundle
  new JavascriptWebpackConfig('js', PATHS, 'wedevelopnl/silverstripe-elemental-grid')
    .setEntry({
      bundle: `${PATHS.SRC}/bundles/bundle.js`,
    })
    .getConfig(),
  // Front-end YouTube/Vimeo player for Element Content video media, required by
  // ElementContentController. Plain config: the admin preset above maps jQuery
  // and other CMS globals as externals, which a front-end page does not have.
  {
    name: 'video',
    mode: ENV === 'development' ? 'development' : 'production',
    entry: { video: `${PATHS.SRC}/video.js` },
    output: { path: `${PATHS.DIST}/js`, filename: '[name].js' },
    devtool: false,
    optimization: {
      minimizer: [new TerserPlugin({ extractComments: false })],
    },
  },
  // sass to css
  new CssWebpackConfig('css', PATHS)
    .setEntry({
      bundle: `${PATHS.SRC}/styles/bundle.scss`,
    })
    .getConfig(),
];

// Use WEBPACK_CHILD=js or WEBPACK_CHILD=css env var to run a single config
module.exports = (process.env.WEBPACK_CHILD)
  ? config.find((entry) => entry.name === process.env.WEBPACK_CHILD)
  : config;
