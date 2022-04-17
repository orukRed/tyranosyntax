"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readQuotedString = exports.readEscapeSequence = exports.readNewlines = exports.readNewline = exports.readSpaces = exports.readNonQuoteString = exports.eolAhead = exports.isSpace = exports.stepChar = exports.nextChar = exports.curChar = exports.stepIf = exports.nextIs = exports.stepLocation = void 0;
const common_1 = require("./common");
const tokens_1 = require("./tokens");
function splitByNewline(str) {
    return str.split('\r\n').reduce((p, s) => {
        p.push(...s.split(/\r|\n/));
        return p;
    }, []);
}
function stepLocation(s, step = 1) {
    const jumped = s.src.substr(s.ptr, step);
    const lines = splitByNewline(jumped);
    s.line += lines.length - 1;
    if (lines.length > 1)
        s.column = 0;
    s.column += (lines.pop() || []).length;
    s.ptr += step;
}
exports.stepLocation = stepLocation;
function strParamToArray(str) {
    const r = typeof str === 'string'
        ? [str]
        : // match longest prefix
            str.sort((a, b) => b.length - a.length);
    return r;
}
/**
 * Check next string, without step
 * @param s
 * @param str
 */
function nextIs(s, str) {
    const _str = strParamToArray(str);
    for (const _s of _str) {
        if (!_s) {
            // check eof
            if (s.src.substr(s.ptr).length == 0)
                return true;
            else
                break;
        }
        const actual = s.src.substr(s.ptr, _s.length);
        if (actual === _s)
            return true;
    }
    return false;
}
exports.nextIs = nextIs;
/**
 * Step if next string match
 * @param s
 * @param str
 */
function stepIf(s, str) {
    const _str = strParamToArray(str);
    for (const _s of _str) {
        if (nextIs(s, _s)) {
            stepLocation(s, _s.length);
            return true;
        }
    }
    return false;
}
exports.stepIf = stepIf;
/**
 * Get current character
 * @param s
 */
function curChar(s) {
    if (s.ptr > s.src.length)
        (0, common_1.e)(s, 'Current char Read over EOF');
    return s.src[s.ptr];
}
exports.curChar = curChar;
/**
 * Get next char
 * @param s
 */
function nextChar(s) {
    if (s.ptr + 1 > s.src.length)
        (0, common_1.e)(s, 'Next char Read over EOF');
    return s.src[s.ptr + 1];
}
exports.nextChar = nextChar;
/**
 * Step to next character and return it
 * @param s
 */
function stepChar(s) {
    stepLocation(s, 1);
    return curChar(s);
}
exports.stepChar = stepChar;
function isSpace(str) {
    if (str === undefined)
        return false;
    // ('\p{Zs}') Seems they supported it.
    // No, they don't... V8 only?
    else
        return str.split('').every((k) => tokens_1.pZs.includes(k));
}
exports.isSpace = isSpace;
function eolAhead(s) {
    return nextIs(s, ['\r', '\n']) || curChar(s) === undefined;
}
exports.eolAhead = eolAhead;
function readNonQuoteString(s, until) {
    let ret = '';
    let _until = strParamToArray(until);
    while (!nextIs(s, _until)) {
        ret += curChar(s);
        stepLocation(s);
    }
    return ret;
}
exports.readNonQuoteString = readNonQuoteString;
function readSpaces(s) {
    while (isSpace(curChar(s))) {
        stepLocation(s);
    }
}
exports.readSpaces = readSpaces;
function readNewline(s) {
    return stepIf(s, '\r\n') ? true : stepIf(s, ['\r', '\n']);
}
exports.readNewline = readNewline;
function readNewlines(s) {
    while (readNewline(s) ? true : readSpaces(s))
        ;
}
exports.readNewlines = readNewlines;
function readEscapeSequence(c, s) {
    if (!stepIf(s, '\\'))
        (0, common_1.e)(s, 'Expected Escape sequence:' + curChar(s));
    const ch = curChar(s);
    switch (ch) {
        case 'u':
            if (!c.unicodeEscape)
                (0, common_1.e)(s, '\\u support disabled');
            // JS Unicode mode
            // \uxxxx
            // \u{??????}
            const digit1 = stepChar(s);
            let cpStr = '';
            if (digit1 === '{') {
                do {
                    cpStr += stepChar(s);
                } while (curChar(s) !== '}');
                cpStr = cpStr.replace(/\}$/, '');
                stepChar(s);
            }
            else {
                cpStr += digit1;
                cpStr += stepChar(s);
                cpStr += stepChar(s);
                cpStr += stepChar(s);
                stepChar(s);
            }
            if (!cpStr.match(/^[0-9a-f]+$/i)) {
                (0, common_1.e)(s, 'Unexpected Unicode codepoint');
            }
            const cpNum = parseInt(cpStr, 16);
            return String.fromCodePoint(cpNum);
        case 'x':
            // TJS Unicode
            // \xu{1,4},max match
            let xStr = '';
            for (let p = 0; p < 4; p++) {
                let nch = nextChar(s);
                if (nch === undefined || !nch.match(/^[0-9a-f]+$/i))
                    break;
                xStr += nch;
                stepChar(s);
            }
            stepChar(s);
            const xNum = parseInt(xStr, 16);
            return String.fromCodePoint(xNum);
        default:
            const convMap = {
                '0': tokens_1.NUL,
                a: tokens_1.BEL,
                b: tokens_1.BS,
                f: tokens_1.FF,
                n: tokens_1.LF,
                r: tokens_1.CR,
                t: tokens_1.HT,
                v: tokens_1.VT
            };
            const mch = convMap[ch];
            stepChar(s);
            if (mch === undefined) {
                return ch;
            }
            else
                return mch;
    }
}
exports.readEscapeSequence = readEscapeSequence;
function readQuotedString(c, s) {
    const q = curChar(s);
    if (q !== '"' && q !== "'") {
        (0, common_1.e)(s, 'Unexpected quote char, actual:' + q);
    }
    stepIf(s, q);
    let r = '';
    outerLoop: while (1) {
        switch (curChar(s)) {
            case '\\':
                const es = readEscapeSequence(c, s);
                r += es;
                break;
            case q:
                break outerLoop;
            case '\r':
            case '\n':
                (0, common_1.e)(s, 'newline is not allowed');
            default:
                r += curChar(s);
                stepChar(s);
                break;
        }
    }
    return r;
}
exports.readQuotedString = readQuotedString;
//# sourceMappingURL=lexer.js.map