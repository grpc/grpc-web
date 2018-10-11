const webpack = require('webpack');
const config = {
    entry:  __dirname + '/js/index.jsx',
    output: {
        path: __dirname + '/dist',
        filename: 'bundle.js',
    },
    resolve: {
        extensions: ['.js', '.jsx', '.css']
    },
    watch: true,
    module: {
        rules: [
          {
            test: /\.jsx?/,
            exclude: /node_modules/,
            use: 'babel-loader'
          },

            {
                test: /\.css?$/,
                loaders: [ 'style-loader', 'css-loader' ],
            },
            {
                test   : /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
                loader : 'file-loader'
            }
          ]
          
      },
};
module.exports = config;