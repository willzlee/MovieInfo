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
    extensions: ['.js', '.jsx'],
    fallback: {
      fs: false,
      path: false,
      os: false,
      crypto: false,
      constants: false,
      stream: false,
      url: false,
      util: false,
      'fs/promises': false
    }
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
      publicPath: '/dist/'
    },
    compress: true,
    port: 5001, // Use a different port than the backend
    host: '0.0.0.0', // Allow external connections
    hot: true,
    historyApiFallback: true,
    open: false, // Disable auto-opening browser in Replit
    devMiddleware: {
      publicPath: '/dist/'
    },
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    ]
  }
};