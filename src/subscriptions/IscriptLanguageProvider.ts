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
 * Provides JavaScript-style completion for iscript blocks
 */
export class IscriptCompletionProvider implements vscode.CompletionItemProvider {
  private iscriptDetector: IscriptDetector;

  constructor() {
    this.iscriptDetector = IscriptDetector.getInstance();
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext,
  ): Promise<vscode.CompletionItem[]> {
    // Only provide JavaScript completions inside iscript blocks
    if (!this.iscriptDetector.isInsideIscriptBlock(document, position)) {
      return [];
    }

    // Get JavaScript completions by delegating to the JavaScript language service
    const iscriptContent = this.iscriptDetector.getIscriptContent(document, position);
    if (!iscriptContent) {
      return [];
    }

    // Create a virtual JavaScript document and get completions from it
    const jsCompletions = await this.getJavaScriptCompletions(document, position, iscriptContent);
    
    // Add TyranoScript-specific completions for iscript blocks
    const tyranoCompletions = this.getTyranoScriptCompletions();
    
    return [...jsCompletions, ...tyranoCompletions];
  }

  private async getJavaScriptCompletions(
    document: vscode.TextDocument,
    position: vscode.Position,
    _iscriptContent: string,
  ): Promise<vscode.CompletionItem[]> {
    const completions: vscode.CompletionItem[] = [];

    // Common JavaScript globals and methods
    const jsGlobals = [
      { name: 'console', detail: 'Console object for logging' },
      { name: 'window', detail: 'Window object' },
      { name: 'document', detail: 'Document object' },
      { name: 'alert', detail: 'Display alert dialog' },
      { name: 'setTimeout', detail: 'Execute function after delay' },
      { name: 'setInterval', detail: 'Execute function repeatedly' },
      { name: 'clearTimeout', detail: 'Clear timeout' },
      { name: 'clearInterval', detail: 'Clear interval' },
      { name: 'JSON', detail: 'JSON utility object' },
      { name: 'Math', detail: 'Mathematical functions and constants' },
      { name: 'Date', detail: 'Date constructor' },
      { name: 'Array', detail: 'Array constructor' },
      { name: 'Object', detail: 'Object constructor' },
      { name: 'String', detail: 'String constructor' },
      { name: 'Number', detail: 'Number constructor' },
      { name: 'Boolean', detail: 'Boolean constructor' },
      { name: 'parseInt', detail: 'Parse string to integer' },
      { name: 'parseFloat', detail: 'Parse string to float' },
      { name: 'isNaN', detail: 'Check if value is NaN' },
      { name: 'isFinite', detail: 'Check if value is finite' },
    ];

    // Get current line to provide context-aware completions
    const currentLine = document.lineAt(position.line).text;
    const beforeCursor = currentLine.substring(0, position.character);

    for (const global of jsGlobals) {
      const item = new vscode.CompletionItem(global.name, vscode.CompletionItemKind.Function);
      item.detail = global.detail;
      item.documentation = new vscode.MarkdownString(`**${global.name}**\n\n${global.detail}`);
      
      // Add specific snippets for common functions
      if (global.name === 'console') {
        item.insertText = new vscode.SnippetString('console.log($1)');
        item.kind = vscode.CompletionItemKind.Snippet;
      } else if (global.name === 'setTimeout') {
        item.insertText = new vscode.SnippetString('setTimeout(function() {\n\t$1\n}, $2)');
        item.kind = vscode.CompletionItemKind.Snippet;
      } else if (global.name === 'alert') {
        item.insertText = new vscode.SnippetString('alert("$1")');
        item.kind = vscode.CompletionItemKind.Snippet;
      }

      completions.push(item);
    }

    // Add JavaScript keywords
    const jsKeywords = [
      'var', 'let', 'const', 'function', 'return', 'if', 'else', 'for', 'while', 
      'do', 'switch', 'case', 'default', 'break', 'continue', 'try', 'catch', 
      'finally', 'throw', 'typeof', 'instanceof', 'new', 'this', 'true', 'false', 
      'null', 'undefined'
    ];

    for (const keyword of jsKeywords) {
      const item = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword);
      item.detail = `JavaScript keyword: ${keyword}`;
      completions.push(item);
    }

    // Context-aware completions
    if (beforeCursor.includes('console.')) {
      const consoleMethods = [
        { name: 'log', snippet: 'log($1)' },
        { name: 'error', snippet: 'error($1)' },
        { name: 'warn', snippet: 'warn($1)' },
        { name: 'info', snippet: 'info($1)' },
        { name: 'debug', snippet: 'debug($1)' },
        { name: 'trace', snippet: 'trace($1)' },
      ];

      for (const method of consoleMethods) {
        const item = new vscode.CompletionItem(method.name, vscode.CompletionItemKind.Method);
        item.insertText = new vscode.SnippetString(method.snippet);
        item.detail = `console.${method.name}()`;
        completions.push(item);
      }
    }

    if (beforeCursor.includes('Math.')) {
      const mathMethods = [
        'abs', 'ceil', 'floor', 'round', 'max', 'min', 'random', 'sqrt', 
        'pow', 'sin', 'cos', 'tan', 'PI', 'E'
      ];

      for (const method of mathMethods) {
        const item = new vscode.CompletionItem(method, vscode.CompletionItemKind.Property);
        item.detail = `Math.${method}`;
        completions.push(item);
      }
    }

    return completions;
  }

  private getTyranoScriptCompletions(): vscode.CompletionItem[] {
    const completions: vscode.CompletionItem[] = [];

    // TyranoScript specific variables and functions available in iscript
    const tyranoItems = [
      { name: 'f', detail: 'TyranoScript game variables', kind: vscode.CompletionItemKind.Variable },
      { name: 'sf', detail: 'TyranoScript system variables', kind: vscode.CompletionItemKind.Variable },
      { name: 'tf', detail: 'TyranoScript temporary variables', kind: vscode.CompletionItemKind.Variable },
      { name: 'mp', detail: 'TyranoScript macro parameters', kind: vscode.CompletionItemKind.Variable },
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
 * Provides JavaScript-style hover information for iscript blocks
 */
export class IscriptHoverProvider implements vscode.HoverProvider {
  private iscriptDetector: IscriptDetector;

  constructor() {
    this.iscriptDetector = IscriptDetector.getInstance();
  }

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.Hover> {
    // Only provide JavaScript hover inside iscript blocks
    if (!this.iscriptDetector.isInsideIscriptBlock(document, position)) {
      return null;
    }

    const range = document.getWordRangeAtPosition(position);
    if (!range) {
      return null;
    }

    const word = document.getText(range);
    
    // Provide hover information for JavaScript globals and TyranoScript variables
    const hoverInfo = this.getHoverInfo(word);
    if (hoverInfo) {
      return new vscode.Hover(hoverInfo, range);
    }

    return null;
  }

  private getHoverInfo(word: string): vscode.MarkdownString | null {
    const jsHoverMap: { [key: string]: string } = {
      'console': '**console**: Object that provides access to the debugging console',
      'alert': '**alert(message)**: Displays an alert dialog with the specified message',
      'setTimeout': '**setTimeout(callback, delay)**: Executes a function after a specified delay',
      'setInterval': '**setInterval(callback, interval)**: Repeatedly executes a function at specified intervals',
      'Math': '**Math**: Object that provides mathematical functions and constants',
      'JSON': '**JSON**: Object for parsing and stringifying JSON data',
      'Date': '**Date**: Constructor for creating date objects',
      'Array': '**Array**: Constructor for creating arrays',
      'Object': '**Object**: Constructor for creating objects',
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
 * Provides JavaScript-style signature help for iscript blocks
 */
export class IscriptSignatureHelpProvider implements vscode.SignatureHelpProvider {
  private iscriptDetector: IscriptDetector;

  constructor() {
    this.iscriptDetector = IscriptDetector.getInstance();
  }

  provideSignatureHelp(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.SignatureHelpContext,
  ): vscode.ProviderResult<vscode.SignatureHelp> {
    // Only provide signature help inside iscript blocks
    if (!this.iscriptDetector.isInsideIscriptBlock(document, position)) {
      return null;
    }

    const line = document.lineAt(position.line).text;
    const beforeCursor = line.substring(0, position.character);
    
    // Simple pattern matching for function calls
    const match = beforeCursor.match(/(\w+)\s*\(\s*([^)]*)$/);
    if (!match) {
      return null;
    }

    const functionName = match[1];
    const signatureInfo = this.getSignatureInfo(functionName);
    
    if (signatureInfo) {
      const signature = new vscode.SignatureInformation(signatureInfo.label, signatureInfo.documentation);
      
      for (const param of signatureInfo.parameters) {
        signature.parameters.push(new vscode.ParameterInformation(param.label, param.documentation));
      }

      const help = new vscode.SignatureHelp();
      help.signatures = [signature];
      help.activeSignature = 0;
      help.activeParameter = 0; // Could be improved to detect current parameter
      
      return help;
    }

    return null;
  }

  private getSignatureInfo(functionName: string): { 
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
        documentation: 'Displays an alert dialog with the specified message',
        parameters: [
          { label: 'message', documentation: 'The message to display in the alert dialog' }
        ]
      },
      'setTimeout': {
        label: 'setTimeout(callback: function, delay: number): number',
        documentation: 'Executes a function after a specified delay in milliseconds',
        parameters: [
          { label: 'callback', documentation: 'The function to execute' },
          { label: 'delay', documentation: 'The delay in milliseconds' }
        ]
      },
      'setInterval': {
        label: 'setInterval(callback: function, interval: number): number',
        documentation: 'Repeatedly executes a function at specified intervals',
        parameters: [
          { label: 'callback', documentation: 'The function to execute' },
          { label: 'interval', documentation: 'The interval in milliseconds' }
        ]
      },
      'parseInt': {
        label: 'parseInt(string: string, radix?: number): number',
        documentation: 'Parses a string and returns an integer',
        parameters: [
          { label: 'string', documentation: 'The string to parse' },
          { label: 'radix', documentation: 'Optional radix (base) for parsing' }
        ]
      },
      'parseFloat': {
        label: 'parseFloat(string: string): number',
        documentation: 'Parses a string and returns a floating point number',
        parameters: [
          { label: 'string', documentation: 'The string to parse' }
        ]
      }
    };

    return signatures[functionName] || null;
  }
}