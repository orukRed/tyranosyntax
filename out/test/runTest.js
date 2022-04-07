"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_test_1 = require("vscode-test");
async function main() {
    try {
        // The folder containing the Extension Manifest package.json
        // Passed to `--extensionDevelopmentPath`
        //拡張マニフェストpackage.jsonを含むフォルダー
        // `--extensionDevelopmentPath`に渡されます
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');
        // The path to test runner
        // Passed to --extensionTestsPath
        //テストランナーへのパス
        //-extensionTestsPathに渡されます
        const extensionTestsPath = path.resolve(__dirname, './suite/index');
        const testWorkSpace = path.resolve(__dirname, './../../../tyrano_test_project/test_project.code-workspace');
        // const testWorkSpace = "";
        // Download VS Code, unzip it and run the integration test
        // VS Codeをダウンロードして解凍し、統合テストを実行します
        await (0, vscode_test_1.runTests)({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: [
                testWorkSpace,
                '--disable-extensions'
            ]
        });
        // await runTests({ extensionDevelopmentPath, extensionTestsPath });
    }
    catch (err) {
        console.error('Failed to run tests');
        process.exit(1);
    }
}
main();
//# sourceMappingURL=runTest.js.map