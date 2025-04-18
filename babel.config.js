module.exports = function (api) {

    // Cache the returned value forever and don't call this function again.
    api.cache(true);
  
    return {
        "presets": [
            [
                "@babel/preset-env",
                {
                    "targets": "> 0.25%, not dead",
                    "useBuiltIns": false,
                    "modules": false,
                    "corejs": false
                }
            ]
        ],
        "plugins": []
    };
};
