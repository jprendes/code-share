const path = require('path');
const HtmlWebPackPlugin = require("html-webpack-plugin");
const FaviconsWebpackPlugin = require("favicons-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const zlib = require("zlib");

const htmlWebPackPluginOptions = {
    title: "Code Share",
    publicPath: "/",
    meta: {
        viewport: "",
    },
    minify: {
        collapseWhitespace: true,
        keepClosingSlash: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyJS: true,
        minifyURLs: true,
    }
};

module.exports = {
    mode: "development",
    devtool: "source-map",
    entry: {
        main: "./src/index.js",
    },
    output: {
        globalObject: "self",
        path: path.resolve(__dirname, "dist"),
        filename: "[name].[contenthash].bundle.js",
    },
    plugins: [
        new CompressionPlugin({
            algorithm: "gzip",
            threshold: 10240,
            minRatio: 0.8,
        }),
        new CompressionPlugin({
            algorithm: "brotliCompress",
            compressionOptions: {
                params: {
                    [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
                },
            },
            threshold: 10240,
            minRatio: 0.8,
        }),
        new FaviconsWebpackPlugin({
            prefix: "assets/[contenthash:8]/",
            logo: "./favicon.svg",
            inject: true,
        }),
        new HtmlWebPackPlugin({
            ...htmlWebPackPluginOptions,
            filename: "index.html",
            template: "./src/html/index.ejs",
        }),
        new HtmlWebPackPlugin({
            ...htmlWebPackPluginOptions,
            filename: ".error-template.html",
            template: "./src/html/error.ejs",
            chunks: [],
        }),
        new MonacoWebpackPlugin({
            filename: "[name].worker.[contenthash].js",
            languages: ["javascript", "typescript", "cpp", "rust"],
        }),
    ],
    module: {
        rules: [{
            test: /\.styl$/,
            use: ["style-loader", "css-loader", "stylus-loader"],
        }, {
            test: /\.css$/,
            use: ["style-loader", "css-loader"]
        }, {
            test: /\.(ttf|woff2?)$/,
            type: "asset/resource"
        }, {
            test: /\.svg$/,
            type: "asset/source"
        }, {
            test: /\.html?$/,
            type: "asset/source"
        }]
    },
    devServer: {
        compress: true,
        port: 8088,
    }
};