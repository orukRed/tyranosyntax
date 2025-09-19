import * as vscode from "vscode";
import { IscriptDetector } from "./IscriptDetector";

/**
 * Provides JavaScript-style comment toggling for iscript blocks
 */
export class IscriptCommentProvider {
  private iscriptDetector: IscriptDetector;

  constructor() {
    this.iscriptDetector = IscriptDetector.getInstance();
  }

  /**
   * Toggle comments using JavaScript style (//) when in iscript blocks,
   * TyranoScript style (;) when outside
   */
  public async toggleLineComment(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== "tyrano") {
      return;
    }

    const document = editor.document;
    const selections = editor.selections;

    await editor.edit((editBuilder) => {
      for (const selection of selections) {
        const startLine = selection.start.line;
        const endLine = selection.end.line;

        for (let line = startLine; line <= endLine; line++) {
          const position = new vscode.Position(line, 0);
          const lineText = document.lineAt(line).text;

          if (this.iscriptDetector.isInsideIscriptBlock(document, position)) {
            // Use JavaScript-style commenting
            this.toggleJavaScriptComment(editBuilder, document, line, lineText);
          } else {
            // Use TyranoScript-style commenting
            this.toggleTyranoScriptComment(editBuilder, document, line, lineText);
          }
        }
      }
    });
  }

  private toggleJavaScriptComment(
    editBuilder: vscode.TextEditorEdit,
    document: vscode.TextDocument,
    line: number,
    lineText: string,
  ): void {
    const trimmed = lineText.trim();
    if (trimmed.startsWith("//")) {
      // Remove JavaScript comment
      const match = lineText.match(/^(\s*)\/\/\s?(.*)$/);
      if (match) {
        const [, indent, content] = match;
        const newText = indent + content;
        const lineRange = document.lineAt(line).range;
        editBuilder.replace(lineRange, newText);
      }
    } else if (trimmed.length > 0) {
      // Add JavaScript comment
      const firstNonWhitespace = lineText.search(/\S/);
      const insertPosition = new vscode.Position(
        line,
        firstNonWhitespace >= 0 ? firstNonWhitespace : 0,
      );
      editBuilder.insert(insertPosition, "// ");
    }
  }

  private toggleTyranoScriptComment(
    editBuilder: vscode.TextEditorEdit,
    document: vscode.TextDocument,
    line: number,
    lineText: string,
  ): void {
    const trimmed = lineText.trim();
    if (trimmed.startsWith(";")) {
      // Remove TyranoScript comment
      const match = lineText.match(/^(\s*);(.*)$/);
      if (match) {
        const [, indent, content] = match;
        const newText = indent + content;
        const lineRange = document.lineAt(line).range;
        editBuilder.replace(lineRange, newText);
      }
    } else if (trimmed.length > 0) {
      // Add TyranoScript comment
      const insertPosition = new vscode.Position(line, 0);
      editBuilder.insert(insertPosition, ";");
    }
  }
}

/**
 * Provides custom on-type formatting for iscript blocks
 */
export class IscriptOnTypeFormattingProvider implements vscode.OnTypeFormattingEditProvider {
  private iscriptDetector: IscriptDetector;

  constructor() {
    this.iscriptDetector = IscriptDetector.getInstance();
  }

  provideOnTypeFormattingEdits(
    document: vscode.TextDocument,
    position: vscode.Position,
    ch: string,
    _options: vscode.FormattingOptions,
    _token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.TextEdit[]> {
    if (this.iscriptDetector.isInsideIscriptBlock(document, position)) {
      // Handle JavaScript-style auto-closing pairs
      // This is a basic implementation - a full implementation would be more complex
      if (ch === "{") {
        // Auto-close braces in JavaScript style
        const line = document.lineAt(position.line);
        const afterCursor = line.text.substring(position.character);

        // Simple heuristic: if the line doesn't already have a closing brace
        if (!afterCursor.includes("}")) {
          return [
            vscode.TextEdit.insert(position, "}"),
          ];
        }
      }
    }
    return [];
  }
}