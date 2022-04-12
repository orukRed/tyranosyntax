"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TyranoDiagnostic = void 0;
const vscode = require("vscode");
// export class TyranoDiagnostic implements vscode.CodeActionProvider {
class TyranoDiagnostic {
    constructor() {
        this.collection = vscode.languages.createDiagnosticCollection('tyranoDiagnostic');
    }
    /**
     * 診断機能を作成する
     * @param document
     * @param commandDiagnostics
     */
    createDiagnostics(document, commandDiagnostics) {
        console.log("createDiagnostics");
        let diagnostics = [];
        let docText = document.getText();
        // [Optional] コメント行を除く
        // 行コメントも取り除きたい
        docText = docText.replace(/\/\*(.*?)\*\//g, "");
        //WARNINGやらERRORのテスト
        let index1 = docText.indexOf("WARNING");
        let pos1 = [index1, index1 + 5];
        let startPos1 = document.positionAt(pos1[0]);
        let endPos1 = document.positionAt(pos1[1]);
        let range1 = new vscode.Range(startPos1, endPos1);
        let diag1 = new vscode.Diagnostic(range1, "WARNING!!!", vscode.DiagnosticSeverity.Warning);
        diagnostics.push(diag1);
        let index2 = docText.indexOf("ERROR");
        let pos2 = [index2, index2 + 5];
        let startPos2 = document.positionAt(pos2[0]);
        let endPos2 = document.positionAt(pos2[1]);
        let range2 = new vscode.Range(startPos2, endPos2);
        let diag2 = new vscode.Diagnostic(range2, "ERROR!!!", vscode.DiagnosticSeverity.Error);
        diagnostics.push(diag2);
        let index3 = docText.indexOf("HINT");
        let pos3 = [index3, index3 + 5];
        let startPos3 = document.positionAt(pos3[0]);
        let endPos3 = document.positionAt(pos3[1]);
        let range3 = new vscode.Range(startPos3, endPos3);
        let diag3 = new vscode.Diagnostic(range3, "HINT!!!", vscode.DiagnosticSeverity.Hint);
        diagnostics.push(diag3);
        let index4 = docText.indexOf("INFO");
        let pos4 = [index4, index4 + 5];
        let startPos4 = document.positionAt(pos4[0]);
        let endPos4 = document.positionAt(pos4[1]);
        let range4 = new vscode.Range(startPos4, endPos4);
        let diag4 = new vscode.Diagnostic(range4, "INFO!!!!", vscode.DiagnosticSeverity.Information);
        diagnostics.push(diag4);
        commandDiagnostics.set(document.uri, diagnostics);
    }
}
exports.TyranoDiagnostic = TyranoDiagnostic;
//# sourceMappingURL=TyranoDiagnostic.js.map