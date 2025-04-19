
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

const makeConfig = ({ env, argv, format, filename, libraryType, bundleJsbi }) => {

    const babel_loader = {
        loader: "babel-loader",
        options: { envName: format }
    }

    const isModule = libraryType === "module";

    const config = {
        mode: argv.mode,
        entry: path.resolve(__dirname, "src/index.ts"),
        output: {
            filename,
            path: path.resolve(__dirname, "dist"),
            library: {
                name: isModule ? undefined : "StdFormat",
                type: libraryType
            },
            module: isModule,
            environment: { module: isModule },
            globalObject: "this"
        },
        experiments: {
            outputModule: isModule
        },
        resolve: {
            // mainFields: ['exports', 'module', 'main'],
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
                    use: [babel_loader],
                },
                {
                    test: /\.ts$/i,
                    use: [babel_loader, "ts-loader"],
                }
            ]
        }
    }

    if (!bundleJsbi) {
        config.externals = {
            jsbi: "jsbi"
        }
    }

    if (argv.mode == 'production') {
        config.optimization = {
            minimize: true,
            minimizer: [new TerserPlugin()],
        }
    }
    else {
        config.devtool = 'source-map';
    }

    return config;
}

module.exports = (env, argv) => {
    return [
        makeConfig({ env, argv, format: "esm", filename: "std-format.esm.mjs", libraryType: "module" }),
        makeConfig({ env, argv, format: "cjs", filename: "std-format.cjs.js", libraryType: "commonjs2" }),
        makeConfig({ env, argv, format: "umd", filename: "std-format.umd.js", libraryType: "umd", bundleJsbi: true })
    ]
};
