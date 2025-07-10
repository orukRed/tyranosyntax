import * as path from "path";

import { runTests } from "vscode-test";

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    //拡張マニフェストpackage.jsonを含むフォルダー
    // `--extensionDevelopmentPath`に渡されます
    const extensionDevelopmentPath = path.resolve(__dirname, "../../");

    // The path to test runner
    // Passed to --extensionTestsPath
    //テストランナーへのパス
    //-extensionTestsPathに渡されます
    const extensionTestsPath = path.resolve(__dirname, "./suite/index");

    const testWorkSpace = path.resolve(
      __dirname,
      "../../test_project/index.html",
    );

    // Download VS Code, unzip it and run the integration test
    // VS Codeをダウンロードして解凍し、統合テストを実行します
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [testWorkSpace, "--disable-extensions"],
    });
    await runTests({ extensionDevelopmentPath, extensionTestsPath });
  } catch (_err) {
    console.error("Failed to run tests");
    process.exit(1);
  }
}

main();


