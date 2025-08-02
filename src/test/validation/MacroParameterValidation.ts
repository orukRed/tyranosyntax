/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Simple validation script to test the macro parameter auto-detection functionality
 */
import * as vscode from "vscode";
import { MacroParameterAnalyzer } from "../../defineData/MacroParameterAnalyzer";
import { DefineMacroData } from "../../defineData/DefineMacroData";

function testMacroParameterAnalyzer(): void {
  console.log("Testing MacroParameterAnalyzer...");

  // Test 1: Real "back" macro from tyrano.ks
  const backMacroContent = `
    [back ]
    @back
    [backlay]
    [image layer=base page=back storage=%storage]
    [trans layer="base" method=%method|crossfade children=false time=%time|2000]
    [wt]
  `;

  const backParams = MacroParameterAnalyzer.analyzeParameters(backMacroContent);
  console.log("Back macro parameters:", backParams);

  // Test 2: Complex CG image button macro
  const cgButtonMacroContent = `
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
        [button graphic=&mp.tmp_graphic[0] x=&mp.x y=&mp.y width=&mp.width height=&mp.height preexp="mp.graphic" exp="tf.selected_cg_image = preexp" storage="cg.ks" target="*clickcg" folder="bgimage" ]
    [else]
        [button graphic=&mp.no_graphic x=&mp.x y=&mp.y width=&mp.width height=&mp.height storage="cg.ks" target="*no_image" folder="bgimage" ]
    [endif]
  `;

  const cgButtonParams = MacroParameterAnalyzer.analyzeParameters(cgButtonMacroContent);
  console.log("CG button macro parameters:", cgButtonParams);

  // Test 3: DefineMacroData integration
  const mockLocation = new vscode.Location(vscode.Uri.file("/test/macro.ks"), new vscode.Position(0, 0));
  const macroData = new DefineMacroData("back", mockLocation, "/test/macro.ks", "Background change macro");
  
  const fullMacroFile = `
    [macro name="back"]
    [back ]
    @back
    [backlay]
    [image layer=base page=back storage=%storage]
    [trans layer="base" method=%method|crossfade children=false time=%time|2000]
    [wt]
    [endmacro]
  `;

  macroData.analyzeAndSetParameters(fullMacroFile);
  const jsonObject = macroData.parseToJsonObject();
  console.log("Back macro JSON object:", JSON.stringify(jsonObject, null, 2));

  // Test 4: Priority system with manual configuration
  const manualConfig = {
    parameters: {
      storage: {
        required: true,
        description: "Background image storage path"
      },
      custom_param: {
        required: false,
        description: "Custom parameter for testing"
      }
    }
  };

  const priorityMacroData = new DefineMacroData("priority_test", mockLocation, "/test/macro.ks", "Priority test macro");
  priorityMacroData.analyzeAndSetParameters(fullMacroFile, manualConfig);
  const priorityJsonObject = priorityMacroData.parseToJsonObject();
  console.log("Priority test macro JSON object:", JSON.stringify(priorityJsonObject, null, 2));

  console.log("MacroParameterAnalyzer validation completed!");
}

// Export for testing
export { testMacroParameterAnalyzer };