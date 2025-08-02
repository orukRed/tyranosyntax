/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import * as vscode from "vscode";
import { DefineMacroData } from "../../../defineData/DefineMacroData";

suite("DefineMacroData Integration", () => {
  vscode.window.showInformationMessage("Start DefineMacroData Integration tests.");

  let mockLocation: vscode.Location;

  setup(() => {
    const uri = vscode.Uri.file("/test/macro.ks");
    const position = new vscode.Position(0, 0);
    mockLocation = new vscode.Location(uri, position);
  });

  suite("analyzeAndSetParameters", () => {
    test("should auto-detect parameters from macro content", () => {
      const fileContent = `
        [macro name="test"]
        [image storage=%storage]
        [trans time=%time|2000]
        [iscript]
        mp.index = 1;
        [endscript]
        [endmacro]
      `;

      const macroData = new DefineMacroData("test", mockLocation, "/test/macro.ks", "Test macro");
      macroData.analyzeAndSetParameters(fileContent);

      const parameters = macroData.parameter;
      assert.strictEqual(parameters.length, 3);
      
      const paramNames = parameters.map(p => p.name).sort();
      assert.deepStrictEqual(paramNames, ["index", "storage", "time"]);
      
      parameters.forEach(param => {
        assert.strictEqual(param.required, false);
        assert.strictEqual(param.description, "Auto-detected parameter from macro content");
      });
    });

    test("should prioritize manually configured parameters", () => {
      const fileContent = `
        [macro name="test"]
        [image storage=%storage]
        [trans time=%time|2000]
        [endmacro]
      `;

      const existingConfig = {
        parameters: {
          storage: {
            required: true,
            description: "Manual storage description"
          },
          custom_param: {
            required: false,
            description: "Manual custom parameter"
          }
        }
      };

      const macroData = new DefineMacroData("test", mockLocation, "/test/macro.ks", "Test macro");
      macroData.analyzeAndSetParameters(fileContent, existingConfig);

      const parameters = macroData.parameter;
      assert.strictEqual(parameters.length, 3);
      
      const storageParam = parameters.find(p => p.name === "storage");
      assert.ok(storageParam);
      assert.strictEqual(storageParam.required, true);
      assert.strictEqual(storageParam.description, "Manual storage description");
      
      const timeParam = parameters.find(p => p.name === "time");
      assert.ok(timeParam);
      assert.strictEqual(timeParam.required, false);
      assert.strictEqual(timeParam.description, "Auto-detected parameter from macro content");
      
      const customParam = parameters.find(p => p.name === "custom_param");
      assert.ok(customParam);
      assert.strictEqual(customParam.required, false);
      assert.strictEqual(customParam.description, "Manual custom parameter");
    });

    test("should handle real-world back macro example", () => {
      const fileContent = `
        [macro name="back"]
        [back ]
        @back
        [backlay]
        [image layer=base page=back storage=%storage]
        [trans layer="base" method=%method|crossfade children=false time=%time|2000]
        [wt]
        [endmacro]
      `;

      const macroData = new DefineMacroData("back", mockLocation, "/test/macro.ks", "Background change macro");
      macroData.analyzeAndSetParameters(fileContent);

      const parameters = macroData.parameter;
      const paramNames = parameters.map(p => p.name).sort();
      assert.deepStrictEqual(paramNames, ["method", "storage", "time"]);
    });

    test("should not duplicate parameters", () => {
      const fileContent = `
        [macro name="test"]
        [image storage=%storage]
        [trans storage=%storage]
        [iscript]
        mp.storage = "test";
        [endscript]
        [endmacro]
      `;

      const macroData = new DefineMacroData("test", mockLocation, "/test/macro.ks", "Test macro");
      macroData.analyzeAndSetParameters(fileContent);

      const parameters = macroData.parameter;
      assert.strictEqual(parameters.length, 1);
      assert.strictEqual(parameters[0].name, "storage");
    });

    test("should generate proper JSON object for completion", () => {
      const fileContent = `
        [macro name="test"]
        [image storage=%storage]
        [trans time=%time|2000]
        [endmacro]
      `;

      const macroData = new DefineMacroData("test", mockLocation, "/test/macro.ks", "Test macro");
      macroData.analyzeAndSetParameters(fileContent);

      const jsonObject = macroData.parseToJsonObject();
      assert.deepStrictEqual(jsonObject, {
        name: "test",
        description: "Test macro",
        parameters: {
          storage: {
            name: "storage",
            required: false,
            description: "Auto-detected parameter from macro content"
          },
          time: {
            name: "time", 
            required: false,
            description: "Auto-detected parameter from macro content"
          }
        }
      });
    });
  });
});