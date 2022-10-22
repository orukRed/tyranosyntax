"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConstantVariables = void 0;
/**
 * 定数を定義するクラス
 */
class ConstantVariables {
}
exports.ConstantVariables = ConstantVariables;
ConstantVariables.variableAndTagParseRegExp = /(\[||\@)(\w+)(\s*)/; //変数やマクロ名を抽出する正規表現 ex:「f.hoge=10;」→「f.hoge」　「[hoge_tag]」→「hoge_tag」
//# sourceMappingURL=ConstantVariables.js.map