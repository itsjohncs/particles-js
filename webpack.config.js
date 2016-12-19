var autoprefixer = require("autoprefixer");

module.exports = {
    context: __dirname + "/particles-src",
    entry: "./main.js",
    output: {
        path: __dirname + "/build",
        filename: "bundle.js",
        publicPath: "/js",
    },
    module: {
        preLoaders: [
            {
                test: /\.js$/,
                loader: "jshint-loader",
                exclude: /node_modules/,
            },
        ],
        loaders: [
            {
                test: /\.js$/,
                loader: "babel-loader",
                exclude: /node_modules/,
                query: {
                    presets: ["es2015"],
                },
            },
            {
                test:   /\.css$/,
                loader: "style-loader!css-loader",
                exclude: /node_modules/,
            }
        ],
    },
    jshint: {
        esversion: 6,
    },
    // postcss: [ autoprefixer({ browsers: ['last 2 versions'] }) ],
}
