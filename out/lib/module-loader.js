"use strict";
//ティラノスクリプト本体にある関数を呼び出すための関数
// https://nazomikan.hateblo.jp/entry/2013/04/10/032410
// module-loader.js
var vm = require("vm");
var fs = require("fs");
var path = require("path");
/**
 * Helper for unit testing:
 * - load module with mocked dependencies
 * - allow accessing private state of the module
 *
 * @param {string} filePath Absolute path to module (file to load)
 * @param {Object=} mocks Hash of mocked dependencies
 */
exports.loadModule = function (filePath, mocks) {
    mocks = mocks || {};
    // this is necessary to allow relative path modules within loaded file
    // i.e. requiring ./some inside file /a/b.js needs to be resolved to /a/some
    var resolveModule = function (module) {
        console.log(module);
        if (module.charAt(0) !== ".")
            return module;
        return path.resolve(path.dirname(filePath), module);
    };
    var exports = {};
    var context = {
        require: function (name) {
            return require(resolveModule(name));
        },
        consol: console,
        exports: exports,
        module: {
            exports: exports,
        },
    };
    //runInNewContextがうまく動いていない？
    console.log(filePath);
    vm.runInNewContext(fs.readFileSync(filePath), context);
    return context;
};
//# sourceMappingURL=module-loader.js.map