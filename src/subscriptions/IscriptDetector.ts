import * as vscode from "vscode";
import { Parser } from "../Parser";

/**
 * Detects if a cursor position is inside an iscript~endscript block
 */
export class IscriptDetector {
  private static instance: IscriptDetector = new IscriptDetector();
  private parser: Parser;

  private constructor() {
    this.parser = Parser.getInstance();
  }

  public static getInstance(): IscriptDetector {
    return this.instance;
  }

  /**
   * Check if the given position is inside an iscript block
   * @param document The text document
   * @param position The cursor position
   * @returns true if inside an iscript block, false otherwise
   */
  public isInsideIscriptBlock(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): boolean {
    try {
      const text = document.getText();
      const parsedData = this.parser.parseText(text);

      // Find the last iscript or endscript tag before the current position
      let lastIscriptLine = -1;
      let lastEndscriptLine = -1;

      for (const data of parsedData) {
        if (data.line <= position.line) {
          if (data.name === "iscript") {
            lastIscriptLine = data.line;
          } else if (data.name === "endscript") {
            lastEndscriptLine = data.line;
          }
        } else {
          break; // We've gone past the current position
        }
      }

      // If we found an iscript tag and it's more recent than any endscript tag,
      // then we're inside an iscript block
      return lastIscriptLine > lastEndscriptLine;
    } catch (_error) {
      // If parsing fails, assume we're not in an iscript block
      return false;
    }
  }

  /**
   * Get the JavaScript code content of the current iscript block
   * @param document The text document
   * @param position The cursor position
   * @returns The JavaScript code if inside an iscript block, null otherwise
   */
  public getIscriptContent(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): string | null {
    if (!this.isInsideIscriptBlock(document, position)) {
      return null;
    }

    try {
      const text = document.getText();
      const parsedData = this.parser.parseText(text);

      let iscriptStartLine = -1;
      let iscriptEndLine = -1;

      // Find the iscript block boundaries
      for (const data of parsedData) {
        if (data.name === "iscript" && data.line <= position.line) {
          iscriptStartLine = data.line;
        } else if (
          data.name === "endscript" &&
          data.line > position.line &&
          iscriptStartLine !== -1
        ) {
          iscriptEndLine = data.line;
          break;
        }
      }

      if (iscriptStartLine !== -1 && iscriptEndLine !== -1) {
        const lines: string[] = [];
        for (let i = iscriptStartLine + 1; i < iscriptEndLine; i++) {
          lines.push(document.lineAt(i).text);
        }
        return lines.join("\n");
      }

      return null;
    } catch (_error) {
      return null;
    }
  }
}