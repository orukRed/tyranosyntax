"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLocation = exports.e = exports.initContext = exports.copyState = exports.initState = void 0;
function initState(src) {
    return {
        src: src,
        ptr: 0,
        line: 1,
        column: 0
    };
}
exports.initState = initState;
function copyState(s) {
    return JSON.parse(JSON.stringify(s));
}
exports.copyState = copyState;
function initContext(ctx = {}) {
    const defaultCtx = {
        loc: true,
        range: true,
        unicodeEscape: true,
        noCommentLabel: true,
        kagex: true,
        commentInAST: true
    };
    return Object.assign(defaultCtx, ctx);
}
exports.initContext = initContext;
function e(state, msg) {
    throw new SyntaxError(`Error at (${state.line},${state.column}):` + msg);
}
exports.e = e;
function addLocation(c, s, s0, node) {
    if (c.range) {
        node.start = s0.ptr;
        node.end = s.ptr;
    }
    if (c.loc) {
        node.loc = {
            start: {
                line: s0.line,
                column: s0.column
            },
            end: {
                line: s.line,
                column: s.column
            }
        };
        node.loc.source = s.src.substring(s0.ptr, s.ptr).trim();
    }
    return node;
}
exports.addLocation = addLocation;
//# sourceMappingURL=common.js.map