
const path = require('path');
const WebpackTemplateConfig = require("./webpack.template.config");

module.exports = (env, argv) => {
    const config = WebpackTemplateConfig(env, argv);

    config.output = {
        path: path.resolve(__dirname, "dist"),
        filename: "std-format.umd.js",
        library: "StdFormat",
        libraryTarget: "umd",
        globalObject: "this"
    }

    return config;
};
