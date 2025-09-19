import * as vscode from "vscode";
import { IscriptDetector } from "./IscriptDetector";

/**
 * Provides dynamic language mode switching for iscript blocks
 * Similar to how HTML files handle JavaScript in <script> tags
 */
export class IscriptLanguageModeProvider implements vscode.DocumentSemanticTokensProvider {
  private static readonly legend = new vscode.SemanticTokensLegend([
    'javascript-region'
  ]);

  private iscriptDetector: IscriptDetector;

  constructor() {
    this.iscriptDetector = IscriptDetector.getInstance();
  }

  static getLegend(): vscode.SemanticTokensLegend {
    return IscriptLanguageModeProvider.legend;
  }

  async provideDocumentSemanticTokens(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): Promise<vscode.SemanticTokens> {
    const builder = new vscode.SemanticTokensBuilder(IscriptLanguageModeProvider.legend);
    
    // Find all iscript blocks and mark them as JavaScript regions
    const text = document.getText();
    const lines = text.split('\n');
    
    let inIscriptBlock = false;
    let iscriptStartLine = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes('[iscript]') || line.includes('[iscript ')) {
        inIscriptBlock = true;
        iscriptStartLine = i;
      } else if (line.includes('[endscript]')) {
        if (inIscriptBlock && iscriptStartLine !== -1) {
          // Mark the entire iscript block as a JavaScript region
          for (let j = iscriptStartLine + 1; j < i; j++) {
            if (lines[j].trim().length > 0) {
              builder.push(
                new vscode.Range(j, 0, j, lines[j].length),
                'javascript-region'
              );
            }
          }
        }
        inIscriptBlock = false;
        iscriptStartLine = -1;
      }
    }

    return builder.build();
  }
}

/**
 * Dynamic document selector that changes based on cursor position
 */
export class IscriptDocumentSelector {
  private iscriptDetector: IscriptDetector;

  constructor() {
    this.iscriptDetector = IscriptDetector.getInstance();
  }

  /**
   * Returns a document selector that matches JavaScript context when in iscript blocks
   */
  getJavaScriptSelector(): vscode.DocumentSelector {
    return [
      {
        scheme: 'file',
        language: 'tyrano',
        pattern: '**/*.ks'
      }
    ];
  }

  /**
   * Checks if the current position should be treated as JavaScript
   */
  isJavaScriptContext(document: vscode.TextDocument, position: vscode.Position): boolean {
    return this.iscriptDetector.isInsideIscriptBlock(document, position);
  }
}

/**
 * Language mode manager that coordinates between TyranoScript and JavaScript modes
 */
export class IscriptLanguageModeManager {
  private iscriptDetector: IscriptDetector;
  private documentSelector: IscriptDocumentSelector;
  private currentMode: 'tyrano' | 'javascript' = 'tyrano';
  private onModeChangeEmitter = new vscode.EventEmitter<'tyrano' | 'javascript'>();

  constructor() {
    this.iscriptDetector = IscriptDetector.getInstance();
    this.documentSelector = new IscriptDocumentSelector();
    
    // Listen for cursor position changes
    vscode.window.onDidChangeTextEditorSelection(this.onSelectionChange, this);
  }

  get onModeChange(): vscode.Event<'tyrano' | 'javascript'> {
    return this.onModeChangeEmitter.event;
  }

  getCurrentMode(): 'tyrano' | 'javascript' {
    return this.currentMode;
  }

  private onSelectionChange(event: vscode.TextEditorSelectionChangeEvent): void {
    const editor = event.textEditor;
    if (editor.document.languageId !== 'tyrano') {
      return;
    }

    const position = editor.selection.active;
    const isInJavaScript = this.documentSelector.isJavaScriptContext(editor.document, position);
    const newMode = isInJavaScript ? 'javascript' : 'tyrano';

    if (newMode !== this.currentMode) {
      this.currentMode = newMode;
      this.onModeChangeEmitter.fire(newMode);
      
      // Update status bar to show current mode
      this.updateStatusBar(newMode);
    }
  }

  private updateStatusBar(mode: 'tyrano' | 'javascript'): void {
    const statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right, 
      100
    );
    
    statusBarItem.text = mode === 'javascript' ? '$(code) JS Mode' : '$(file-code) TyranoScript';
    statusBarItem.tooltip = mode === 'javascript' 
      ? 'JavaScript mode active in iscript block' 
      : 'TyranoScript mode active';
    statusBarItem.show();

    // Hide after 2 seconds
    setTimeout(() => {
      statusBarItem.hide();
      statusBarItem.dispose();
    }, 2000);
  }

  dispose(): void {
    this.onModeChangeEmitter.dispose();
  }
}

/**
 * JavaScript language features provider that works with the mode manager
 */
export class IscriptJavaScriptFeaturesProvider {
  private languageModeManager: IscriptLanguageModeManager;
  private jsCompletionDisposable?: vscode.Disposable;
  private jsHoverDisposable?: vscode.Disposable;

  constructor(languageModeManager: IscriptLanguageModeManager) {
    this.languageModeManager = languageModeManager;
    
    // Listen for mode changes
    this.languageModeManager.onModeChange(this.onModeChange, this);
  }

  private async onModeChange(mode: 'tyrano' | 'javascript'): Promise<void> {
    if (mode === 'javascript') {
      await this.enableJavaScriptFeatures();
    } else {
      this.disableJavaScriptFeatures();
    }
  }

  private async enableJavaScriptFeatures(): Promise<void> {
    // Temporarily register JavaScript language features
    const jsDocSelector: vscode.DocumentSelector = { 
      scheme: 'file', 
      language: 'tyrano',
      pattern: '**/*.ks'
    };

    // Try to get JavaScript completions by creating a virtual JS document
    this.jsCompletionDisposable = vscode.languages.registerCompletionItemProvider(
      jsDocSelector,
      {
        async provideCompletionItems(document, position, _token, context) {
          // Check if we're in an iscript block
          const iscriptDetector = IscriptDetector.getInstance();
          if (!iscriptDetector.isInsideIscriptBlock(document, position)) {
            return [];
          }

          // Get the iscript content and create a virtual JavaScript document
          const iscriptContent = iscriptDetector.getIscriptContent(document, position);
          if (!iscriptContent) {
            return [];
          }

          try {
            // Create a temporary JavaScript file
            const jsDoc = await vscode.workspace.openTextDocument({
              content: iscriptContent,
              language: 'javascript'
            });

            // Get JavaScript completions from the temporary document
            const jsCompletions = await vscode.commands.executeCommand<vscode.CompletionList>(
              'vscode.executeCompletionItemProvider',
              jsDoc.uri,
              new vscode.Position(0, 0),
              context.triggerCharacter
            );

            return jsCompletions?.items || [];
          } catch (error) {
            console.error('Error getting JavaScript completions:', error);
            return [];
          }
        }
      },
      '.', '(', ' '
    );

    // Register hover provider
    this.jsHoverDisposable = vscode.languages.registerHoverProvider(
      jsDocSelector,
      {
        async provideHover(document, position, _token) {
          const iscriptDetector = IscriptDetector.getInstance();
          if (!iscriptDetector.isInsideIscriptBlock(document, position)) {
            return null;
          }

          const range = document.getWordRangeAtPosition(position);
          if (!range) {
            return null;
          }

          const word = document.getText(range);
          
          // Provide hover for common JavaScript globals
          const jsGlobals: { [key: string]: string } = {
            'console': 'Console object for logging and debugging',
            'alert': 'Displays an alert dialog box',
            'setTimeout': 'Executes a function after a specified delay',
            'Math': 'Mathematical functions and constants',
            'JSON': 'JSON parsing and stringifying utilities',
            'Date': 'Date and time functionality'
          };

          if (jsGlobals[word]) {
            return new vscode.Hover(
              new vscode.MarkdownString(`**${word}** (JavaScript)\n\n${jsGlobals[word]}`),
              range
            );
          }

          return null;
        }
      }
    );
  }

  private disableJavaScriptFeatures(): void {
    if (this.jsCompletionDisposable) {
      this.jsCompletionDisposable.dispose();
      this.jsCompletionDisposable = undefined;
    }

    if (this.jsHoverDisposable) {
      this.jsHoverDisposable.dispose();
      this.jsHoverDisposable = undefined;
    }
  }

  dispose(): void {
    this.disableJavaScriptFeatures();
  }
}