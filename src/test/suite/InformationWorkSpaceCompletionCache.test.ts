import * as assert from "assert";
import * as path from "path";
import { InformationWorkSpace } from "../../InformationWorkSpace";

suite("InformationWorkSpace completion fast paths", () => {
  test("uses the deepest known project root for a file", async () => {
    const info = InformationWorkSpace.getInstance();
    const originalSuggestions = info.suggestions;
    const parentProjectPath = path.resolve("issue416-parent-project");
    const nestedProjectPath = path.join(parentProjectPath, "nested-project");

    try {
      info.suggestions = new Map([
        [parentProjectPath, {}],
        [nestedProjectPath, {}],
      ]);

      const projectPath = await info.getProjectPathByFilePath(
        path.join(nestedProjectPath, "data", "scenario", "scene.ks"),
      );

      assert.strictEqual(projectPath, nestedProjectPath);
    } finally {
      info.suggestions = originalSuggestions;
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
