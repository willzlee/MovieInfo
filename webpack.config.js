const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'public/dist'),
    filename: 'bundle.js',
    publicPath: '/dist/'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/template.html',
      filename: 'index.html'
    })
  ],
  mode: 'development',
  // Development server configuration
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    port: 5001, // Use a different port than the backend
    hot: true,
    historyApiFallback: true,
    open: true,
    devMiddleware: {
      publicPath: '/dist/',
    },
  }
};