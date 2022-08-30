"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TyranoDefinitionProvider = void 0;
const vscode = require("vscode");
const ConstantVariables_1 = require("../ConstantVariables");
class TyranoDefinitionProvider {
    constructor() {
    }
    /**
     * Provide the definition of the symbol at the given position and document.
     *
     * @param document The document in which the command was invoked.
     * @param position The position at which the command was invoked.
     * @param token A cancellation token.
     * @return A definition or a thenable that resolves to such. The lack of a result can be
     * signaled by returning `undefined` or `null`.
     */
    provideDefinition(document, position, token) {
        console.log("provideImplementation");
        console.log(`document:${document.fileName}\nposition:${position.line}\ntoken:${token}\n`);
        const parsedWord = document.getText(document.getWordRangeAtPosition(position, ConstantVariables_1.ConstantVariables.variableAndTagParseRegExp)); //現在位置の単語を取得。
        //タグを分ける正規表現
        console.log(`parsedWord:${parsedWord}`);
        return new vscode.Location(vscode.Uri.file("C:\\Users\\yamaguchi\\Desktop\\test.txt"), new vscode.Position(0, 0)); //なんかここに返せばいいっぽい
        /**
 * vscode.Definition
 * 1 つまたは複数の場所として表されるシンボルの定義。ほとんどのプログラミング言語では、シンボルが定義される場所は 1 つだけです。
 *
 * vscode.LocationLink[]
 * 2 つの場所の接続を表します。元の範囲を含む、通常の場所に関する追加のメタデータを提供します。
 */
        return null; //未定義の場合null
    }
}
exports.TyranoDefinitionProvider = TyranoDefinitionProvider;
//# sourceMappingURL=TyranoDefinitionProvider.js.map