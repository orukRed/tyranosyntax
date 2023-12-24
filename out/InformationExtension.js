"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InformationExtension = void 0;
class InformationExtension {
    static instance = new InformationExtension();
    constructor() { }
    static getInstance() {
        return this.instance;
    }
    _path = undefined;
    get path() {
        return this._path;
    }
    set path(value) {
        this._path = value;
    }
}
exports.InformationExtension = InformationExtension;
//# sourceMappingURL=InformationExtension.js.map