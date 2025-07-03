const { Parser } = require("./out/Parser");
const fs = require("fs");

const parser = Parser.getInstance();
const testContent = fs.readFileSync("/tmp/test_macro_docstring.ks", "utf8");

console.log("Test content:");
console.log(testContent);
console.log("\n" + "=".repeat(50) + "\n");

const parsedData = parser.parseText(testContent);

console.log("Parsed data:");
parsedData.forEach((item, index) => {
  console.log(`${index}: ${JSON.stringify(item, null, 2)}`);
});