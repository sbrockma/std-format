const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const packageJson = require("./package.json");

const makeConfig = ({ env, argv, format, filename, libraryType, bundleJsbi }) => {

    const babel_loader = {
        loader: "babel-loader",
        options: { envName: format }
    }

    const config = {
        mode: argv.mode,
        entry: path.resolve(__dirname, "src/index.ts"),
        output: {
            filename,
            path: path.resolve(__dirname, "dist"),
            library: {
                // Set library name to "StdFormat" for "umd" only, to enable StdFormat.format(...) in browser.
                // Do not set library name for "cjs", or it would require const Fmt = require(...).StdFormat;
                name: libraryType === "umd" ? "StdFormat" : undefined,
                type: libraryType,
                // Importing default export on esm failed if "exports" was set to "default".
                export: libraryType === "module" ? undefined : "default",
            },
            module: libraryType === "module",
            environment: { module: libraryType === "module" },
            chunkFormat: libraryType === "module" ? "module" : undefined,
            globalObject: "this"
        },
        experiments: {
            outputModule: libraryType === "module"
        },
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
                    use: [babel_loader],
                },
                {
                    test: /\.ts$/i,
                    use: [babel_loader, "ts-loader"],
                }
            ]
        },
        plugins: [
            new webpack.DefinePlugin({
                __LIB_VERSION__: JSON.stringify(packageJson.version)
            }),
            new webpack.BannerPlugin({
                banner: `StdFormat v${packageJson.version} | (c) 2025 Stefan Brockmann | Licensed under the zlib License | Includes JSBI (Apache License 2.0)`,
                raw: false, // if false, it will automatically wrap inside /* ... */
            }),
        ]
    }

    if (!bundleJsbi) {
        config.externals = {
            jsbi: "jsbi"
        }
    }

    if (argv.mode == 'production') {
        config.optimization = {
            minimize: true,
            minimizer: [new TerserPlugin({ extractComments: false })]
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
