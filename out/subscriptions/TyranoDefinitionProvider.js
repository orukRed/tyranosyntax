"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TyranoDefinitionProvider = void 0;
const InformationWorkSpace_1 = require("../InformationWorkSpace");
const Parser_1 = require("../Parser");
/**
 * F12押したタグの定義元へジャンプするクラスです。
 */
class TyranoDefinitionProvider {
    infoWs = InformationWorkSpace_1.InformationWorkSpace.getInstance();
    parser = Parser_1.Parser.getInstance();
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
    async provideDefinition(document, position, token) {
        const projectPath = await this.infoWs.getProjectPathByFilePath(document.uri.fsPath);
        const parsedData = this.parser.parseText(document.lineAt(position.line).text);
        const tagIndex = this.parser.getIndex(parsedData, position.character);
        //カーソル位置のマクロのMapデータ取得
        const retMacroData = this.infoWs.defineMacroMap.get(projectPath)?.get(parsedData[tagIndex]["name"]);
        return retMacroData?.location;
    }
}
exports.TyranoDefinitionProvider = TyranoDefinitionProvider;
//# sourceMappingURL=TyranoDefinitionProvider.js.map