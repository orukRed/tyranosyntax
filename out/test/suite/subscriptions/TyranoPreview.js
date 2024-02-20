"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TyranoPreview = void 0;
const InformationExtension_1 = require("../InformationExtension");
class TyranoPreview {
    static async createWindow() {
        const infoE = InformationExtension_1.InformationExtension.getInstance();
        if (!vscode.window.activeTextEditor || !infoE.path) {
            return;
        }
    }
}
exports.TyranoPreview = TyranoPreview;
//# sourceMappingURL=TyranoPreview.js.map