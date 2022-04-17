"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pZs = exports.EOL = exports.EOF = exports.CJKRSB = exports.CJKLSB = exports.CR = exports.FF = exports.VT = exports.LF = exports.HT = exports.BS = exports.BEL = exports.NUL = void 0;
exports.NUL = '\0';
exports.BEL = '\x07';
exports.BS = '\x08';
exports.HT = '\x09';
exports.LF = '\x0a';
exports.VT = '\x0b';
exports.FF = '\x0c';
exports.CR = '\x0d';
exports.CJKLSB = '【';
exports.CJKRSB = '】';
// Special flag EOF
exports.EOF = '';
exports.EOL = [exports.EOF, exports.CR, exports.LF, exports.CR + exports.LF];
exports.pZs = [
    '\u0020',
    '\u00a0',
    '\u1680',
    '\u2000',
    '\u2001',
    '\u2002',
    '\u2003',
    '\u2004',
    '\u2005',
    '\u2006',
    '\u2007',
    '\u2008',
    '\u2009',
    '\u200a',
    '\u202f',
    '\u205f',
    '\u3000'
];
//# sourceMappingURL=tokens.js.map