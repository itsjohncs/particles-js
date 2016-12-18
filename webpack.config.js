module.exports = {
    context: __dirname + "/particles-src",
    entry: "./main.js",
    output: {
        path: __dirname + "/build",
        filename: "bundle.js",
        publicPath: "/js",
    },
    watch: true,
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
            },
        ],
    },
    jshint: {
        esversion: 6,
    }
}
