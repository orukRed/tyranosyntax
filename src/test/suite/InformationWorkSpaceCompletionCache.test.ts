import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { InformationWorkSpace } from "../../InformationWorkSpace";

suite("InformationWorkSpace completion fast paths", () => {
  test("prefers a newly-created nested project over a known parent root", async () => {
    const info = InformationWorkSpace.getInstance();
    const originalSuggestions = info.suggestions;
    const testDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), "tyranosyntax-issue416-"),
    );
    const parentProjectPath = path.join(testDirectory, "parent-project");
    const nestedProjectPath = path.join(parentProjectPath, "nested-project");
    const scenarioDirectory = path.join(nestedProjectPath, "data", "scenario");

    try {
      fs.mkdirSync(scenarioDirectory, { recursive: true });
      fs.writeFileSync(path.join(parentProjectPath, "index.html"), "");
      fs.writeFileSync(path.join(nestedProjectPath, "index.html"), "");
      info.suggestions = new Map([[parentProjectPath, {}]]);

      const projectPath = await info.getProjectPathByFilePath(
        path.join(scenarioDirectory, "scene.ks"),
      );

      assert.strictEqual(projectPath, nestedProjectPath);
    } finally {
      info.suggestions = originalSuggestions;
      fs.rmSync(testDirectory, { recursive: true, force: true });
    }
  });

  test("increments the suggestion version when a dynamic tag is removed", async () => {
    const info = InformationWorkSpace.getInstance();
    const originalSuggestions = info.suggestions;
    const projectPath = path.resolve("issue416-version-project");

    try {
      info.suggestions = new Map([
        [
          projectPath,
          {
            issue416_dynamic_tag: {
              name: "issue416_dynamic_tag",
              description: "dynamic tag",
              parameters: [],
            },
          },
        ],
      ]);
      const previousVersion = info.getSuggestionVersion(projectPath);

      await info.spliceSuggestionsByFilePath(projectPath, [
        "issue416_dynamic_tag",
      ]);

      assert.ok(
        info.getSuggestionVersion(projectPath) > previousVersion,
        "removing a dynamic tag should invalidate tag completion candidates",
      );
      assert.strictEqual(
        (info.suggestions.get(projectPath) as Record<string, unknown>)[
          "issue416_dynamic_tag"
        ],
        undefined,
      );
    } finally {
      info.suggestions = originalSuggestions;
    }
  });
});
