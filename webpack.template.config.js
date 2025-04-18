
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {

    const config = {
        mode: argv.mode,
        entry: path.resolve(__dirname, "src/index.ts"),
        // output: {},
        resolve: {
            extensions: [".ts", ".js"],
            modules: [
                path.resolve(__dirname, "./src"),
                "node_modules"
            ],
            fallback: { "crypto": false }
        },
        module: {
            rules: [
                {
                    test: /\.js$/i,
                    use: ["babel-loader"],
                },
                {
                    test: /\.ts$/i,
                    use: ["babel-loader", "ts-loader"],
                }
            ]
        }
    }

    if (argv.mode == 'production') {
        config.optimization = {
            minimize: true,
            minimizer: [new TerserPlugin()],
        }
    }
    else {
        config.optimization = {
            minimize: false,
            minimizer: []
        }
        config.devtool = 'source-map';
    }

    return config;
};
