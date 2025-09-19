import * as vscode from "vscode";

/**
 * JavaScript tokens and language features imported from Microsoft's official sources
 * This leverages TypeScript's compiler API and VSCode's built-in JavaScript language features
 */
export class MicrosoftJavaScriptTokens {
  private static instance: MicrosoftJavaScriptTokens = new MicrosoftJavaScriptTokens();

  private constructor() {}

  public static getInstance(): MicrosoftJavaScriptTokens {
    return this.instance;
  }

  /**
   * Get JavaScript completion items using Microsoft's TypeScript language service
   * This delegates to VSCode's built-in JavaScript/TypeScript extension
   */
  public async getJavaScriptCompletions(
    document: vscode.TextDocument,
    position: vscode.Position,
    iscriptContent: string,
    context?: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[]> {
    try {
      // Create a virtual JavaScript document to leverage TypeScript language service
      const virtualJsDoc = await vscode.workspace.openTextDocument({
        content: iscriptContent,
        language: 'javascript'
      });

      // Calculate relative position within the iscript block
      const lines = document.getText().split('\n');
      let iscriptStartLine = -1;
      
      for (let i = 0; i <= position.line; i++) {
        if (lines[i]?.includes('[iscript]')) {
          iscriptStartLine = i;
        }
      }

      if (iscriptStartLine === -1) {
        return [];
      }

      // Calculate position relative to the start of iscript content
      const relativePosition = new vscode.Position(
        Math.max(0, position.line - iscriptStartLine - 1),
        position.character
      );

      // Use VSCode's built-in JavaScript completion provider
      const jsCompletions = await vscode.commands.executeCommand<vscode.CompletionList>(
        'vscode.executeCompletionItemProvider',
        virtualJsDoc.uri,
        relativePosition,
        context?.triggerCharacter
      );

      return jsCompletions?.items || [];
    } catch (error) {
      console.error('Error getting Microsoft JavaScript completions:', error);
      return this.getFallbackJavaScriptCompletions();
    }
  }

  /**
   * Get JavaScript hover information using Microsoft's language service
   */
  public async getJavaScriptHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    iscriptContent: string
  ): Promise<vscode.Hover | null> {
    try {
      const virtualJsDoc = await vscode.workspace.openTextDocument({
        content: iscriptContent,
        language: 'javascript'
      });

      const range = document.getWordRangeAtPosition(position);
      if (!range) {
        return null;
      }

      // Calculate relative position within iscript block
      const lines = document.getText().split('\n');
      let iscriptStartLine = -1;
      
      for (let i = 0; i <= position.line; i++) {
        if (lines[i]?.includes('[iscript]')) {
          iscriptStartLine = i;
        }
      }

      if (iscriptStartLine === -1) {
        return null;
      }

      const relativePosition = new vscode.Position(
        Math.max(0, position.line - iscriptStartLine - 1),
        position.character
      );

      // Use VSCode's built-in JavaScript hover provider
      const jsHovers = await vscode.commands.executeCommand<vscode.Hover[]>(
        'vscode.executeHoverProvider',
        virtualJsDoc.uri,
        relativePosition
      );

      return jsHovers?.[0] || null;
    } catch (error) {
      console.error('Error getting Microsoft JavaScript hover:', error);
      return null;
    }
  }

  /**
   * Get JavaScript signature help using Microsoft's language service
   */
  public async getJavaScriptSignatureHelp(
    document: vscode.TextDocument,
    position: vscode.Position,
    iscriptContent: string,
    context?: vscode.SignatureHelpContext
  ): Promise<vscode.SignatureHelp | null> {
    try {
      const virtualJsDoc = await vscode.workspace.openTextDocument({
        content: iscriptContent,
        language: 'javascript'
      });

      // Calculate relative position within iscript block
      const lines = document.getText().split('\n');
      let iscriptStartLine = -1;
      
      for (let i = 0; i <= position.line; i++) {
        if (lines[i]?.includes('[iscript]')) {
          iscriptStartLine = i;
        }
      }

      if (iscriptStartLine === -1) {
        return null;
      }

      const relativePosition = new vscode.Position(
        Math.max(0, position.line - iscriptStartLine - 1),
        position.character
      );

      // Use VSCode's built-in JavaScript signature help provider
      const signatureHelp = await vscode.commands.executeCommand<vscode.SignatureHelp>(
        'vscode.executeSignatureHelpProvider',
        virtualJsDoc.uri,
        relativePosition,
        context?.triggerCharacter
      );

      return signatureHelp || null;
    } catch (error) {
      console.error('Error getting Microsoft JavaScript signature help:', error);
      return null;
    }
  }

  /**
   * Get JavaScript diagnostics using Microsoft's language service
   */
  public async getJavaScriptDiagnostics(
    _document: vscode.TextDocument,
    iscriptContent: string
  ): Promise<vscode.Diagnostic[]> {
    try {
      const virtualJsDoc = await vscode.workspace.openTextDocument({
        content: iscriptContent,
        language: 'javascript'
      });

      // Use VSCode's built-in JavaScript diagnostic provider
      const diagnostics = await vscode.commands.executeCommand<vscode.Diagnostic[]>(
        'vscode.executeDiagnosticProvider',
        virtualJsDoc.uri
      );

      return diagnostics || [];
    } catch (error) {
      console.error('Error getting Microsoft JavaScript diagnostics:', error);
      return [];
    }
  }

  /**
   * Fallback JavaScript completions when Microsoft's language service is not available
   */
  private getFallbackJavaScriptCompletions(): vscode.CompletionItem[] {
    const completions: vscode.CompletionItem[] = [];

    // Essential JavaScript globals from Microsoft's TypeScript lib definitions
    const microsoftJsGlobals = [
      // Console API
      { name: 'console', kind: vscode.CompletionItemKind.Class, detail: 'Console API' },
      
      // Global functions
      { name: 'alert', kind: vscode.CompletionItemKind.Function, detail: 'alert(message?: any): void' },
      { name: 'confirm', kind: vscode.CompletionItemKind.Function, detail: 'confirm(message?: string): boolean' },
      { name: 'prompt', kind: vscode.CompletionItemKind.Function, detail: 'prompt(message?: string, _default?: string): string | null' },
      
      // Timers
      { name: 'setTimeout', kind: vscode.CompletionItemKind.Function, detail: 'setTimeout(handler: TimerHandler, timeout?: number, ...arguments): number' },
      { name: 'setInterval', kind: vscode.CompletionItemKind.Function, detail: 'setInterval(handler: TimerHandler, timeout?: number, ...arguments): number' },
      { name: 'clearTimeout', kind: vscode.CompletionItemKind.Function, detail: 'clearTimeout(id?: number): void' },
      { name: 'clearInterval', kind: vscode.CompletionItemKind.Function, detail: 'clearInterval(id?: number): void' },
      
      // Global objects
      { name: 'Math', kind: vscode.CompletionItemKind.Class, detail: 'Math: Math object' },
      { name: 'Date', kind: vscode.CompletionItemKind.Class, detail: 'DateConstructor: Date constructor' },
      { name: 'JSON', kind: vscode.CompletionItemKind.Class, detail: 'JSON: JSON object' },
      { name: 'Array', kind: vscode.CompletionItemKind.Class, detail: 'ArrayConstructor: Creates an array' },
      { name: 'Object', kind: vscode.CompletionItemKind.Class, detail: 'ObjectConstructor: Provides functionality common to all JavaScript objects' },
      { name: 'String', kind: vscode.CompletionItemKind.Class, detail: 'StringConstructor: String constructor' },
      { name: 'Number', kind: vscode.CompletionItemKind.Class, detail: 'NumberConstructor: Number constructor' },
      { name: 'Boolean', kind: vscode.CompletionItemKind.Class, detail: 'BooleanConstructor: Boolean constructor' },
      { name: 'RegExp', kind: vscode.CompletionItemKind.Class, detail: 'RegExpConstructor: Regular expression constructor' },
      
      // Global functions
      { name: 'parseInt', kind: vscode.CompletionItemKind.Function, detail: 'parseInt(string: string, radix?: number): number' },
      { name: 'parseFloat', kind: vscode.CompletionItemKind.Function, detail: 'parseFloat(string: string): number' },
      { name: 'isNaN', kind: vscode.CompletionItemKind.Function, detail: 'isNaN(number: number): boolean' },
      { name: 'isFinite', kind: vscode.CompletionItemKind.Function, detail: 'isFinite(number: number): boolean' },
      { name: 'encodeURI', kind: vscode.CompletionItemKind.Function, detail: 'encodeURI(uri: string): string' },
      { name: 'encodeURIComponent', kind: vscode.CompletionItemKind.Function, detail: 'encodeURIComponent(uriComponent: string | number | boolean): string' },
      { name: 'decodeURI', kind: vscode.CompletionItemKind.Function, detail: 'decodeURI(encodedURI: string): string' },
      { name: 'decodeURIComponent', kind: vscode.CompletionItemKind.Function, detail: 'decodeURIComponent(encodedURIComponent: string): string' },
      
      // Browser globals (when available)
      { name: 'window', kind: vscode.CompletionItemKind.Class, detail: 'Window: Browser window object' },
      { name: 'document', kind: vscode.CompletionItemKind.Class, detail: 'Document: HTML document object' },
      { name: 'location', kind: vscode.CompletionItemKind.Class, detail: 'Location: Browser location object' },
      { name: 'navigator', kind: vscode.CompletionItemKind.Class, detail: 'Navigator: Browser navigator object' },
      { name: 'history', kind: vscode.CompletionItemKind.Class, detail: 'History: Browser history object' }
    ];

    for (const global of microsoftJsGlobals) {
      const item = new vscode.CompletionItem(global.name, global.kind);
      item.detail = global.detail;
      item.documentation = new vscode.MarkdownString(`**${global.name}**\n\n${global.detail}`);
      completions.push(item);
    }

    // JavaScript keywords from Microsoft's TypeScript definitions
    const jsKeywords = [
      'abstract', 'any', 'as', 'boolean', 'break', 'case', 'catch', 'class', 'const', 'constructor',
      'continue', 'debugger', 'declare', 'default', 'delete', 'do', 'else', 'enum', 'export',
      'extends', 'false', 'finally', 'for', 'from', 'function', 'get', 'if', 'implements',
      'import', 'in', 'instanceof', 'interface', 'is', 'let', 'module', 'namespace', 'new',
      'null', 'number', 'of', 'package', 'private', 'protected', 'public', 'readonly',
      'return', 'set', 'static', 'string', 'super', 'switch', 'symbol', 'this', 'throw',
      'true', 'try', 'type', 'typeof', 'undefined', 'var', 'void', 'while', 'with', 'yield'
    ];

    for (const keyword of jsKeywords) {
      const item = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword);
      item.detail = `JavaScript keyword: ${keyword}`;
      completions.push(item);
    }

    return completions;
  }

  /**
   * Get specific method completions for JavaScript objects (like console.log, Math.random, etc.)
   */
  public getObjectMethodCompletions(objectName: string): vscode.CompletionItem[] {
    const methodMap: { [key: string]: Array<{ name: string; detail: string; snippet?: string }> } = {
      'console': [
        { name: 'log', detail: 'console.log(...data: any[]): void', snippet: 'log($1)' },
        { name: 'error', detail: 'console.error(...data: any[]): void', snippet: 'error($1)' },
        { name: 'warn', detail: 'console.warn(...data: any[]): void', snippet: 'warn($1)' },
        { name: 'info', detail: 'console.info(...data: any[]): void', snippet: 'info($1)' },
        { name: 'debug', detail: 'console.debug(...data: any[]): void', snippet: 'debug($1)' },
        { name: 'trace', detail: 'console.trace(...data: any[]): void', snippet: 'trace($1)' },
        { name: 'clear', detail: 'console.clear(): void', snippet: 'clear()' },
        { name: 'count', detail: 'console.count(label?: string): void', snippet: 'count($1)' },
        { name: 'time', detail: 'console.time(label?: string): void', snippet: 'time($1)' },
        { name: 'timeEnd', detail: 'console.timeEnd(label?: string): void', snippet: 'timeEnd($1)' }
      ],
      'Math': [
        { name: 'abs', detail: 'Math.abs(x: number): number' },
        { name: 'ceil', detail: 'Math.ceil(x: number): number' },
        { name: 'floor', detail: 'Math.floor(x: number): number' },
        { name: 'round', detail: 'Math.round(x: number): number' },
        { name: 'max', detail: 'Math.max(...values: number[]): number' },
        { name: 'min', detail: 'Math.min(...values: number[]): number' },
        { name: 'random', detail: 'Math.random(): number' },
        { name: 'sqrt', detail: 'Math.sqrt(x: number): number' },
        { name: 'pow', detail: 'Math.pow(x: number, y: number): number' },
        { name: 'sin', detail: 'Math.sin(x: number): number' },
        { name: 'cos', detail: 'Math.cos(x: number): number' },
        { name: 'tan', detail: 'Math.tan(x: number): number' },
        { name: 'PI', detail: 'Math.PI: number' },
        { name: 'E', detail: 'Math.E: number' }
      ],
      'JSON': [
        { name: 'parse', detail: 'JSON.parse(text: string, reviver?: (this: any, key: string, value: any) => any): any', snippet: 'parse($1)' },
        { name: 'stringify', detail: 'JSON.stringify(value: any, replacer?: (this: any, key: string, value: any) => any, space?: string | number): string', snippet: 'stringify($1)' }
      ],
      'Date': [
        { name: 'now', detail: 'Date.now(): number' },
        { name: 'parse', detail: 'Date.parse(s: string): number' }
      ]
    };

    const methods = methodMap[objectName] || [];
    return methods.map(method => {
      const item = new vscode.CompletionItem(method.name, vscode.CompletionItemKind.Method);
      item.detail = method.detail;
      if (method.snippet) {
        item.insertText = new vscode.SnippetString(method.snippet);
      }
      item.documentation = new vscode.MarkdownString(`**${objectName}.${method.name}**\n\n${method.detail}`);
      return item;
    });
  }
}