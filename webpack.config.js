const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const packageJson = require("./package.json");

const makeConfig = ({ env, argv, format, filename, libraryType, bundleJsbi }) => {
    const isDevelopment = argv.mode === "development";
    const isMinified = filename.includes(".min.");
    const isModule = libraryType === "module";

    return {
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
                export: isModule ? undefined : "default",
            },
            module: isModule,
            environment: { module: isModule },
            chunkFormat: isModule ? "module" : undefined,
            globalObject: "this"
        },
        experiments: {
            outputModule: isModule
        },
        resolve: {
            extensions: [".ts", ".js"],
            modules: [
                path.resolve(__dirname, "./src"),
                "node_modules"
            ]
        },
        module: {
            rules: [
                {
                    test: /\.js$/i,
                    use: [{
                        loader: "babel-loader",
                        options: { envName: format }
                    }],
                },
                {
                    test: /\.ts$/i,
                    use: [
                        {
                            loader: "babel-loader",
                            options: { envName: format }
                        },
                        "ts-loader"
                    ],
                }
            ]
        },
        plugins: [
            new webpack.BannerPlugin({
                banner: `TypeScript/JavaScript String Formatter v${packageJson.version} | (c) 2025 Stefan Brockmann | Licensed under the zlib License | Includes JSBI (Apache License 2.0)`
            }),
        ],
        externals: bundleJsbi ? undefined : {
            jsbi: "jsbi"
        },
        optimization: {
            minimize: isMinified,
            minimizer: isMinified ? [new TerserPlugin({ extractComments: false })] : undefined,
        },
        devtool: isDevelopment ? "source-map" : false,
        performance: { hints: false },
        stats: "errors-only"
    }
}

module.exports = (env, argv) => {
    return [
        makeConfig({ env, argv, format: "esm", filename: "index.esm.mjs", libraryType: "module" }),
        makeConfig({ env, argv, format: "cjs", filename: "index.cjs.js", libraryType: "commonjs2" }),
        makeConfig({ env, argv, format: "umd", filename: "index.umd.min.js", libraryType: "umd", bundleJsbi: true })
    ]
};
