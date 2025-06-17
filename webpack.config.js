const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js', // Entry point of your React app
  output: {
    path: path.resolve(__dirname, 'build'), // Output directory for built files
    filename: 'bundle.js', // Name of the bundled JavaScript file
    publicPath: '/'
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
        use: ['style-loader', 'css-loader', 'postcss-loader'] // For Tailwind CSS
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html', // Path to your HTML template
      filename: 'index.html' // Name of the output HTML file
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 3000,
    historyApiFallback: true, // For React Router if you add it later
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  }
};
