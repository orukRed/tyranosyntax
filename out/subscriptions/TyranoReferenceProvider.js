"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TyranoReferenceProvider = void 0;
class TyranoReferenceProvider {
    constructor() {
    }
    provideReferences(document, position, context, token) {
        console.log("provideReference");
        console.log(`document:${document.fileName}\nposition:${position.line}\ncontext:${context}\ntoken:${token}\n`);
        return null; //未定義の場合null
    }
}
exports.TyranoReferenceProvider = TyranoReferenceProvider;
//# sourceMappingURL=TyranoReferenceProvider.js.map