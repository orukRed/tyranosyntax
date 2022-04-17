"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
const common_1 = require("./common");
const parser_1 = require("./parser");
function parse(src, ctx) {
    const c = (0, common_1.initContext)(ctx || {});
    const s = (0, common_1.initState)(src);
    const p = (0, parser_1.parseScript)(c, s);
    return p;
}
exports.parse = parse;
//# sourceMappingURL=index.js.map