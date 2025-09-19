import * as vscode from "vscode";
import { IscriptDetector } from "./IscriptDetector";
import { MicrosoftJavaScriptTokens } from "./MicrosoftJavaScriptTokens";

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
 * Provides JavaScript-style completion for iscript blocks using Microsoft's JavaScript tokens
 */
export class IscriptCompletionProvider implements vscode.CompletionItemProvider {
  private iscriptDetector: IscriptDetector;
  private microsoftJsTokens: MicrosoftJavaScriptTokens;

  constructor() {
    this.iscriptDetector = IscriptDetector.getInstance();
    this.microsoftJsTokens = MicrosoftJavaScriptTokens.getInstance();
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    context: vscode.CompletionContext,
  ): Promise<vscode.CompletionItem[]> {
    // Only provide JavaScript completions inside iscript blocks
    if (!this.iscriptDetector.isInsideIscriptBlock(document, position)) {
      return [];
    }

    // Get iscript content for Microsoft's language service
    const iscriptContent = this.iscriptDetector.getIscriptContent(document, position);
    if (!iscriptContent) {
      return [];
    }

    try {
      // Use Microsoft's JavaScript tokens and language service
      const microsoftCompletions = await this.microsoftJsTokens.getJavaScriptCompletions(
        document,
        position,
        iscriptContent,
        context
      );

      // Add context-aware completions for object methods
      const contextCompletions = this.getContextAwareCompletions(document, position);
      
      // Add TyranoScript-specific completions
      const tyranoCompletions = this.getTyranoScriptCompletions();
      
      return [...microsoftCompletions, ...contextCompletions, ...tyranoCompletions];
    } catch (error) {
      console.error('Error getting Microsoft JavaScript completions:', error);
      // Fallback to basic completions
      return this.getTyranoScriptCompletions();
    }
  }

  private getContextAwareCompletions(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] {
    const line = document.lineAt(position.line).text;
    const beforeCursor = line.substring(0, position.character);
    
    // Check for object method completions (console., Math., JSON., etc.)
    const objectMatch = beforeCursor.match(/(\w+)\.$/);
    if (objectMatch) {
      const objectName = objectMatch[1];
      return this.microsoftJsTokens.getObjectMethodCompletions(objectName);
    }

    return [];
  }

  private getTyranoScriptCompletions(): vscode.CompletionItem[] {
    const completions: vscode.CompletionItem[] = [];

    // TyranoScript specific variables and functions available in iscript
    const tyranoItems = [
      { name: 'f', detail: 'TyranoScript game variables - persistent across saves', kind: vscode.CompletionItemKind.Variable },
      { name: 'sf', detail: 'TyranoScript system variables - persistent across different games', kind: vscode.CompletionItemKind.Variable },
      { name: 'tf', detail: 'TyranoScript temporary variables - cleared when script ends', kind: vscode.CompletionItemKind.Variable },
      { name: 'mp', detail: 'TyranoScript macro parameters - values passed to macros', kind: vscode.CompletionItemKind.Variable },
      { name: 'TYRANO', detail: 'TyranoScript engine object', kind: vscode.CompletionItemKind.Class },
    ];

    for (const item of tyranoItems) {
      const completionItem = new vscode.CompletionItem(item.name, item.kind);
      completionItem.detail = item.detail;
      completionItem.documentation = new vscode.MarkdownString(`**${item.name}**\n\n${item.detail}`);
      completions.push(completionItem);
    }

    return completions;
  }
}

/**
 * Provides JavaScript-style hover information for iscript blocks using Microsoft's tokens
 */
export class IscriptHoverProvider implements vscode.HoverProvider {
  private iscriptDetector: IscriptDetector;
  private microsoftJsTokens: MicrosoftJavaScriptTokens;

  constructor() {
    this.iscriptDetector = IscriptDetector.getInstance();
    this.microsoftJsTokens = MicrosoftJavaScriptTokens.getInstance();
  }

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
  ): Promise<vscode.Hover | null> {
    // Only provide JavaScript hover inside iscript blocks
    if (!this.iscriptDetector.isInsideIscriptBlock(document, position)) {
      return null;
    }

    const iscriptContent = this.iscriptDetector.getIscriptContent(document, position);
    if (!iscriptContent) {
      return null;
    }

    try {
      // Use Microsoft's JavaScript hover service
      const microsoftHover = await this.microsoftJsTokens.getJavaScriptHover(
        document,
        position,
        iscriptContent
      );

      if (microsoftHover) {
        return microsoftHover;
      }
    } catch (error) {
      console.error('Error getting Microsoft JavaScript hover:', error);
    }

    // Fallback to basic hover information
    const range = document.getWordRangeAtPosition(position);
    if (!range) {
      return null;
    }

    const word = document.getText(range);
    const hoverInfo = this.getBasicHoverInfo(word);
    
    if (hoverInfo) {
      return new vscode.Hover(hoverInfo, range);
    }

    return null;
  }

  private getBasicHoverInfo(word: string): vscode.MarkdownString | null {
    const jsHoverMap: { [key: string]: string } = {
      'console': '**console**: Object that provides access to the debugging console (Microsoft JavaScript)',
      'alert': '**alert(message)**: Displays an alert dialog with the specified message (Microsoft JavaScript)',
      'setTimeout': '**setTimeout(callback, delay)**: Executes a function after a specified delay (Microsoft JavaScript)',
      'setInterval': '**setInterval(callback, interval)**: Repeatedly executes a function at specified intervals (Microsoft JavaScript)',
      'Math': '**Math**: Object that provides mathematical functions and constants (Microsoft JavaScript)',
      'JSON': '**JSON**: Object for parsing and stringifying JSON data (Microsoft JavaScript)',
      'Date': '**Date**: Constructor for creating date objects (Microsoft JavaScript)',
      'Array': '**Array**: Constructor for creating arrays (Microsoft JavaScript)',
      'Object': '**Object**: Constructor for creating objects (Microsoft JavaScript)',
      'f': '**f**: TyranoScript game variables - persistent across saves',
      'sf': '**sf**: TyranoScript system variables - persistent across different games',
      'tf': '**tf**: TyranoScript temporary variables - cleared when script ends',
      'mp': '**mp**: TyranoScript macro parameters - values passed to macros',
      'TYRANO': '**TYRANO**: Main TyranoScript engine object'
    };

    if (jsHoverMap[word]) {
      return new vscode.MarkdownString(jsHoverMap[word]);
    }

    return null;
  }
}

/**
 * Provides JavaScript-style signature help for iscript blocks using Microsoft's tokens
 */
export class IscriptSignatureHelpProvider implements vscode.SignatureHelpProvider {
  private iscriptDetector: IscriptDetector;
  private microsoftJsTokens: MicrosoftJavaScriptTokens;

  constructor() {
    this.iscriptDetector = IscriptDetector.getInstance();
    this.microsoftJsTokens = MicrosoftJavaScriptTokens.getInstance();
  }

  async provideSignatureHelp(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    context: vscode.SignatureHelpContext,
  ): Promise<vscode.SignatureHelp | null> {
    // Only provide signature help inside iscript blocks
    if (!this.iscriptDetector.isInsideIscriptBlock(document, position)) {
      return null;
    }

    const iscriptContent = this.iscriptDetector.getIscriptContent(document, position);
    if (!iscriptContent) {
      return null;
    }

    try {
      // Use Microsoft's JavaScript signature help service
      const microsoftSignatureHelp = await this.microsoftJsTokens.getJavaScriptSignatureHelp(
        document,
        position,
        iscriptContent,
        context
      );

      if (microsoftSignatureHelp) {
        return microsoftSignatureHelp;
      }
    } catch (error) {
      console.error('Error getting Microsoft JavaScript signature help:', error);
    }

    // Fallback to basic signature help
    return this.getBasicSignatureHelp(document, position);
  }

  private getBasicSignatureHelp(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.SignatureHelp | null {
    const line = document.lineAt(position.line).text;
    const beforeCursor = line.substring(0, position.character);
    
    // Simple pattern matching for function calls
    const match = beforeCursor.match(/(\w+)\s*\(\s*([^)]*)$/);
    if (!match) {
      return null;
    }

    const functionName = match[1];
    const signatureInfo = this.getBasicSignatureInfo(functionName);
    
    if (signatureInfo) {
      const signature = new vscode.SignatureInformation(signatureInfo.label, signatureInfo.documentation);
      
      for (const param of signatureInfo.parameters) {
        signature.parameters.push(new vscode.ParameterInformation(param.label, param.documentation));
      }

      const help = new vscode.SignatureHelp();
      help.signatures = [signature];
      help.activeSignature = 0;
      help.activeParameter = 0;
      
      return help;
    }

    return null;
  }

  private getBasicSignatureInfo(functionName: string): { 
    label: string; 
    documentation: string; 
    parameters: Array<{ label: string; documentation: string }> 
  } | null {
    const signatures: { [key: string]: { 
      label: string; 
      documentation: string; 
      parameters: Array<{ label: string; documentation: string }> 
    } } = {
      'alert': {
        label: 'alert(message: string): void',
        documentation: 'Displays an alert dialog with the specified message (Microsoft JavaScript)',
        parameters: [
          { label: 'message', documentation: 'The message to display in the alert dialog' }
        ]
      },
      'setTimeout': {
        label: 'setTimeout(callback: function, delay: number): number',
        documentation: 'Executes a function after a specified delay in milliseconds (Microsoft JavaScript)',
        parameters: [
          { label: 'callback', documentation: 'The function to execute' },
          { label: 'delay', documentation: 'The delay in milliseconds' }
        ]
      },
      'setInterval': {
        label: 'setInterval(callback: function, interval: number): number',
        documentation: 'Repeatedly executes a function at specified intervals (Microsoft JavaScript)',
        parameters: [
          { label: 'callback', documentation: 'The function to execute' },
          { label: 'interval', documentation: 'The interval in milliseconds' }
        ]
      },
      'parseInt': {
        label: 'parseInt(string: string, radix?: number): number',
        documentation: 'Parses a string and returns an integer (Microsoft JavaScript)',
        parameters: [
          { label: 'string', documentation: 'The string to parse' },
          { label: 'radix', documentation: 'Optional radix (base) for parsing' }
        ]
      },
      'parseFloat': {
        label: 'parseFloat(string: string): number',
        documentation: 'Parses a string and returns a floating point number (Microsoft JavaScript)',
        parameters: [
          { label: 'string', documentation: 'The string to parse' }
        ]
      }
    };

    return signatures[functionName] || null;
  }
}