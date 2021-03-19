const pkgJson = require('hls.js/package.json');

const path = require('path')

const webpack = require('webpack')
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const importHelper = require('@babel/helper-module-imports');

module.exports = {
  mode: 'production',
  entry: path.join(__dirname, 'src', 'index.ts'),

  output: {
    filename: "m2ts_to_fmp4.js",
    path: path.join(__dirname, 'dist'),
    library: {
      name: 'M2TStoFMP4',
      type: 'umd',
      export: 'default'
    },
    libraryTarget: 'umd'
  },

  resolve: {
    extensions: ['.ts', '.js'],
  },

  optimization: {
    minimizer: [new TerserPlugin({
      extractComments: false,
    })],
  },

  module: {
    rules: [
      {
        test: /\.(ts|js)$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              presets: [
                '@babel/preset-typescript',
                [
                  '@babel/preset-env',
                  {
                    loose: true,
                    modules: false,
                    targets: {
                      browsers: [
                        'chrome >= 47',
                        'firefox >= 51',
                        'ie >= 11',
                        'safari >= 8',
                        'ios >= 8',
                        'android >= 4',
                      ],
                    },
                  },
                ],
              ],
              plugins: [
                [
                  '@babel/plugin-proposal-class-properties',
                  {
                    loose: true,
                  },
                ],
                '@babel/plugin-proposal-object-rest-spread',
                {
                  visitor: {
                    CallExpression: function (espath) {
                      if (espath.get('callee').matchesPattern('Number.isFinite')) {
                        espath.node.callee = importHelper.addNamed(
                          espath,
                          'isFiniteNumber',
                          path.resolve('node_modules/hls.js/src/polyfills/number')
                        );
                      } else if (
                        espath
                          .get('callee')
                          .matchesPattern('Number.MAX_SAFE_INTEGER')
                      ) {
                        espath.node.callee = importHelper.addNamed(
                          espath,
                          'MAX_SAFE_INTEGER',
                          path.resolve('node_modules/hls.js/src/polyfills/number')
                        );
                      }
                    },
                  },
                },
                ['@babel/plugin-transform-object-assign'],
                ['@babel/plugin-proposal-optional-chaining'],
              ],
            },
          }
        ],
      }
    ]
  },

  plugins: [
    new CleanWebpackPlugin(),
    new webpack.DefinePlugin({
      __VERSION__: JSON.stringify(pkgJson.version),
      __USE_SUBTITLES__: JSON.stringify(true),
      __USE_ALT_AUDIO__: JSON.stringify(true),
      __USE_EME_DRM__: JSON.stringify(true),
    })
  ]
};
