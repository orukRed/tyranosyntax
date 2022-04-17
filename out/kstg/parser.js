"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseScript = exports.eolTransform = exports.parseText = exports.parseCookedText = exports.parseLiteralFromNonQuotedString = exports.parseCommand = exports.parseCommandParameter = exports.parseLiteral = exports.parseLabel = exports.parseComment = exports.parseIdentifier = void 0;
const common_1 = require("./common");
const lexer_1 = require("./lexer");
const tokens_1 = require("./tokens");
function parseIdentifier(c, s, end = tokens_1.EOL) {
    let s0 = (0, common_1.copyState)(s);
    const i = {
        type: 'Identifier',
        name: (0, lexer_1.readNonQuoteString)(s, end)
    };
    return (0, common_1.addLocation)(c, s, s0, i);
}
exports.parseIdentifier = parseIdentifier;
function parseComment(c, s, labelComment = false) {
    const s0 = (0, common_1.copyState)(s);
    if (!(0, lexer_1.stepIf)(s, ';') && !labelComment)
        (0, common_1.e)(s, 'expect comment start');
    const n = {
        type: 'Comment',
        raw: (0, lexer_1.readNonQuoteString)(s, tokens_1.EOL).trim()
    };
    (0, lexer_1.readNewlines)(s);
    return (0, common_1.addLocation)(c, s, s0, n);
}
exports.parseComment = parseComment;
function parseLabel(c, s) {
    let s0 = (0, common_1.copyState)(s);
    (0, lexer_1.stepIf)(s, '*');
    const name = parseIdentifier(c, s, ['|'].concat(c.noCommentLabel ? tokens_1.EOL : []));
    const n = {
        type: 'Label',
        name: name
    };
    if ((0, lexer_1.stepIf)(s, '|')) {
        n.comment = parseComment(c, s, true);
    }
    (0, lexer_1.readNewlines)(s);
    return (0, common_1.addLocation)(c, s, s0, n);
}
exports.parseLabel = parseLabel;
function parseLiteral(c, s) {
    const s0 = (0, common_1.copyState)(s);
    let value = '';
    if ((0, lexer_1.curChar)(s) !== '"' && (0, lexer_1.curChar)(s) !== "'") {
        let rawValue = (0, lexer_1.readNonQuoteString)(s, [']', '='].concat(tokens_1.pZs));
        let intValue = parseInt(rawValue);
        value =
            isFinite(intValue) && rawValue.match(/^[0-9]+$/) // only decimal
                ? intValue
                : rawValue;
        if (value === 'true')
            value = true;
        else if (value === 'false')
            value = false;
    }
    else {
        value = (0, lexer_1.readQuotedString)(c, s);
        (0, lexer_1.stepChar)(s);
    }
    const n = {
        type: 'Literal',
        value: value
    };
    return (0, common_1.addLocation)(c, s, s0, n);
}
exports.parseLiteral = parseLiteral;
function parseCommandParameter(c, s) {
    let s0 = (0, common_1.copyState)(s);
    let key = parseIdentifier(c, s, [']', '='].concat(tokens_1.pZs).concat(tokens_1.EOL));
    (0, lexer_1.readSpaces)(s);
    let n = {
        type: 'CommandParameter',
        name: key
    };
    if ((0, lexer_1.stepIf)(s, '=')) {
        (0, lexer_1.readSpaces)(s);
        n.value = parseLiteral(c, s);
    }
    return (0, common_1.addLocation)(c, s, s0, n);
}
exports.parseCommandParameter = parseCommandParameter;
function parseCommandContent(c, s) {
    const r = [];
    (0, lexer_1.readSpaces)(s);
    const i = parseIdentifier(c, s, [']', ''].concat(tokens_1.pZs).concat(tokens_1.EOL));
    (0, lexer_1.readSpaces)(s);
    while (!(0, lexer_1.eolAhead)(s) && (0, lexer_1.curChar)(s) !== ']') {
        r.push(parseCommandParameter(c, s));
        (0, lexer_1.readSpaces)(s);
    }
    return [i, r];
}
// EOL after Text is a command in KAGEX...
// So we read a more EOL at Command
function parseCommand(c, s) {
    let s0 = (0, common_1.copyState)(s);
    let name = { type: 'Identifier', name: '' };
    let param = [];
    if ((0, lexer_1.stepIf)(s, '@')) {
        [name, param] = parseCommandContent(c, s);
        (0, lexer_1.readNewlines)(s);
    }
    else if ((0, lexer_1.stepIf)(s, '[')) {
        [name, param] = parseCommandContent(c, s);
        (0, lexer_1.stepIf)(s, ']');
        if ((0, lexer_1.nextIs)(s, tokens_1.EOL))
            (0, lexer_1.readNewlines)(s);
    }
    else {
        (0, common_1.e)(s, 'parseCommand fail');
    }
    const n = {
        type: 'Command',
        name: name,
        parameters: param
    };
    return (0, common_1.addLocation)(c, s, s0, n);
}
exports.parseCommand = parseCommand;
function parseLiteralFromNonQuotedString(c, s, end) {
    let s0 = (0, common_1.copyState)(s);
    const i = {
        type: 'Literal',
        value: (0, lexer_1.readNonQuoteString)(s, end)
    };
    return (0, common_1.addLocation)(c, s, s0, i);
}
exports.parseLiteralFromNonQuotedString = parseLiteralFromNonQuotedString;
function parseCookedText(c, s) {
    const s0 = (0, common_1.copyState)(s);
    const r = {
        type: 'CookedText',
        said: {
            type: 'Literal',
            value: ''
        }
    };
    if ((0, lexer_1.stepIf)(s, tokens_1.CJKLSB)) {
        r.name = parseIdentifier(c, s, ['/', tokens_1.CJKRSB]);
        if ((0, lexer_1.stepIf)(s, '/')) {
            r.as = parseIdentifier(c, s, [tokens_1.CJKRSB]);
        }
        (0, lexer_1.stepIf)(s, tokens_1.CJKRSB);
    }
    r.said = parseLiteralFromNonQuotedString(c, s, ['*', '|', '@', '['].concat(tokens_1.EOL));
    return (0, common_1.addLocation)(c, s, s0, r);
}
exports.parseCookedText = parseCookedText;
function parseText(c, s) {
    const s0 = (0, common_1.copyState)(s);
    const r = {
        type: 'Text',
        raw: ''
    };
    if (!c.kagex) {
        r.raw = (0, lexer_1.readNonQuoteString)(s, ['*', '|', '@', '['].concat(tokens_1.EOL));
    }
    else {
        r.cooked = parseCookedText(c, s);
        r.raw = s.src.substring(s0.ptr, s.ptr);
    }
    return (0, common_1.addLocation)(c, s, s0, r);
}
exports.parseText = parseText;
function eolTransform(c, s) {
    const s0 = (0, common_1.copyState)(s);
    if (!(0, lexer_1.stepIf)(s, tokens_1.EOL))
        (0, common_1.e)(s, 'Expect EOL');
    (0, lexer_1.readNewlines)(s);
    const n = {
        type: 'Command',
        name: null,
        parameters: []
    };
    return (0, common_1.addLocation)(c, s, s0, n);
}
exports.eolTransform = eolTransform;
function parseScript(c, s) {
    const s0 = (0, common_1.copyState)(s);
    const st = [];
    while (!(0, lexer_1.nextIs)(s, tokens_1.EOF)) {
        switch ((0, lexer_1.curChar)(s)) {
            case '[':
            case '@':
                st.push(parseCommand(c, s));
                break;
            case ';':
                const cmt = parseComment(c, s);
                if (c.commentInAST)
                    st.push(cmt);
                break;
            case '*':
                st.push(parseLabel(c, s));
                break;
            case '\r':
            case '\n':
                const vcmd = eolTransform(c, s);
                if (c.kagex)
                    st.push(vcmd);
                break;
            default:
                st.push(parseText(c, s));
                break;
        }
    }
    const n = {
        type: 'Script',
        contents: st
    };
    return (0, common_1.addLocation)(c, s, s0, n);
}
exports.parseScript = parseScript;
//# sourceMappingURL=parser.js.map