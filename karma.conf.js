"use strict";

const webpackConfigFunc = require("./webpack.config");
const webpackConfigArr = webpackConfigFunc({}, { mode: "development" });
const webpackConfig = webpackConfigArr[0];

module.exports = function (config) {
    config.set({
        webpack: {
            mode: "development",
            devtool: "source-map",
            module: webpackConfig.module,
            resolve: webpackConfig.resolve,
            plugins: webpackConfig.plugins
        },
        basePath: "",
        frameworks: ["jasmine"],
        files: [
            {
                pattern: "src/**/*.test.ts",
                watched: false
            }
        ],
        preprocessors: {
            "src/**/*.test.ts": ["webpack", "sourcemap"]
        },
        exclude: [],
        plugins: [
            "karma-webpack",
            "karma-jasmine",
            "karma-sourcemap-loader",
            "karma-chrome-launcher",
        ],
        module: "es2015",
        reporters: ["progress"],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ["Chrome"],
        singleRun: false,
        concurrency: 1, //Infinity
        browserDisconnectTimeout: 60000,
        browserDisconnectTolerance: 3,
        browserNoActivityTimeout: 100000,
        //flags: ["--disable-gpu", "--no-sandbox"]
    });
}
