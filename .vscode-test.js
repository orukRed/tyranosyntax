/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const { defineConfig } = require("@vscode/test-cli");

module.exports = defineConfig([
  {
    label: "unitTests",
    files: "out/test/**/*.test.js",
    version: "insiders",
    workspaceFolder: "./test_project",
    mocha: {
      ui: "tdd",
      timeout: 20000,
    },
  },
  // you can specify additional test configurations, too
]);
