/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import * as vscode from "vscode";
import { MacroParameterAnalyzer } from "../../../defineData/MacroParameterAnalyzer";

suite("MacroParameterAnalyzer", () => {
  vscode.window.showInformationMessage("Start MacroParameterAnalyzer tests.");

  suite("analyzeParameters", () => {
    test("should extract mp.variable parameters", () => {
      const macroContent = `
        [iscript]
        tf.data = tf.array_save[mp.index];
        tf.title = tf.data.title;
        TG.menu.doSave(mp.index);
        [endscript]
      `;
      
      const result = MacroParameterAnalyzer.analyzeParameters(macroContent);
      assert.deepStrictEqual(result, ["index"]);
    });

    test("should extract %variable parameters", () => {
      const macroContent = `
        [image storage=%storage left=%left|0 top=%top|0]
        [trans method=%method|crossfade time=%time|2000]
      `;
      
      const result = MacroParameterAnalyzer.analyzeParameters(macroContent);
      assert.deepStrictEqual(result, ["left", "method", "storage", "time", "top"]);
    });

    test("should extract both mp.variable and %variable parameters", () => {
      const macroContent = `
        [image storage=%storage]
        [iscript]
        sf.cg_view[mp.graphic] = "on";
        [endscript]
        [trans time=%time|1000]
      `;
      
      const result = MacroParameterAnalyzer.analyzeParameters(macroContent);
      assert.deepStrictEqual(result, ["graphic", "storage", "time"]);
    });

    test("should remove duplicates", () => {
      const macroContent = `
        [image storage=%storage]
        [trans storage=%storage time=%time]
        [iscript]
        mp.storage = "test";
        [endscript]
      `;
      
      const result = MacroParameterAnalyzer.analyzeParameters(macroContent);
      assert.deepStrictEqual(result, ["storage", "time"]);
    });

    test("should ignore parameters starting with numbers", () => {
      const macroContent = `
        [image storage=%1storage]
        [trans method=%2method]
        [iscript]
        mp.3index = 1;
        [endscript]
      `;
      
      const result = MacroParameterAnalyzer.analyzeParameters(macroContent);
      assert.deepStrictEqual(result, []);
    });

    test("should return empty array for empty content", () => {
      const result = MacroParameterAnalyzer.analyzeParameters("");
      assert.deepStrictEqual(result, []);
    });

    test("should handle complex real-world macro content", () => {
      const macroContent = `
        [iscript]
        mp.graphic = mp.graphic.split(',');
        mp.tmp_graphic = mp.graphic.concat();
        tf.is_cg_open = false;
        if(sf.cg_view[mp.graphic[0]]){
            tf.is_cg_open = true;
        }
        if(typeof mp.thumb !="undefined"){
            mp.tmp_graphic[0] = mp.thumb;
        }
        [endscript]
        [if exp="tf.is_cg_open==true"]
            [button graphic=&mp.tmp_graphic[0] x=&mp.x y=&mp.y width=&mp.width height=&mp.height]
        [else]
            [button graphic=&mp.no_graphic x=&mp.x y=&mp.y width=&mp.width height=&mp.height]
        [endif]
      `;
      
      const result = MacroParameterAnalyzer.analyzeParameters(macroContent);
      assert.deepStrictEqual(result, ["graphic", "height", "no_graphic", "thumb", "tmp_graphic", "width", "x", "y"]);
    });
  });

  suite("extractMacroContent", () => {
    test("should extract content between macro and endmacro tags", () => {
      const fileContent = `
        [macro name="test"]
        [image storage=%storage]
        [trans time=%time]
        [endmacro]
      `;
      
      const result = MacroParameterAnalyzer.extractMacroContent(fileContent, "test");
      assert.strictEqual(result.trim(), "[image storage=%storage]\n        [trans time=%time]");
    });

    test("should handle macros with quoted names", () => {
      const fileContent = `
        [macro name="test_macro"]
        [image storage=%storage]
        [endmacro]
      `;
      
      const result = MacroParameterAnalyzer.extractMacroContent(fileContent, "test_macro");
      assert.strictEqual(result.trim(), "[image storage=%storage]");
    });

    test("should handle macros without quotes", () => {
      const fileContent = `
        [macro name=test_macro]
        [image storage=%storage]
        [endmacro]
      `;
      
      const result = MacroParameterAnalyzer.extractMacroContent(fileContent, "test_macro");
      assert.strictEqual(result.trim(), "[image storage=%storage]");
    });

    test("should return empty string if macro not found", () => {
      const fileContent = `
        [macro name="other"]
        [image storage=%storage]
        [endmacro]
      `;
      
      const result = MacroParameterAnalyzer.extractMacroContent(fileContent, "test");
      assert.strictEqual(result, "");
    });

    test("should return empty string if endmacro not found", () => {
      const fileContent = `
        [macro name="test"]
        [image storage=%storage]
      `;
      
      const result = MacroParameterAnalyzer.extractMacroContent(fileContent, "test");
      assert.strictEqual(result, "");
    });

    test("should handle multiple macros and extract the correct one", () => {
      const fileContent = `
        [macro name="first"]
        [image storage=%first_storage]
        [endmacro]
        
        [macro name="second"]
        [image storage=%second_storage]
        [endmacro]
      `;
      
      const result = MacroParameterAnalyzer.extractMacroContent(fileContent, "second");
      assert.strictEqual(result.trim(), "[image storage=%second_storage]");
    });
  });
});