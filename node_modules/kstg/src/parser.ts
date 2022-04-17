import { Context, State, addLocation, e, copyState } from './common';
import {
    Label,
    Command,
    CommandParameter,
    Identifier,
    Literal,
    CookedText,
    Text,
    Script,
    Content,
    Comment
} from './kstree';
import {
    readNonQuoteString,
    readSpaces,
    curChar,
    readQuotedString,
    stepChar,
    eolAhead,
    readNewlines,
    stepIf,
    nextIs
} from './lexer';
import { pZs, EOF, EOL, CJKLSB, CJKRSB } from './tokens';

export function parseIdentifier(
    c: Context,
    s: State,
    end: string | string[] = EOL
): Identifier {
    let s0 = copyState(s);
    const i: Identifier = {
        type: 'Identifier',
        name: readNonQuoteString(s, end)
    };
    return addLocation(c, s, s0, i) as Identifier;
}

export function parseComment(
    c: Context,
    s: State,
    labelComment = false
): Comment {
    const s0 = copyState(s);
    if (!stepIf(s, ';') && !labelComment) e(s, 'expect comment start');
    const n: Comment = {
        type: 'Comment',
        raw: readNonQuoteString(s, EOL).trim()
    };
    readNewlines(s);
    return addLocation(c, s, s0, n) as Comment;
}

export function parseLabel(c: Context, s: State): Label {
    let s0 = copyState(s);
    stepIf(s, '*');
    const name = parseIdentifier(
        c,
        s,
        ['|'].concat(c.noCommentLabel ? EOL : [])
    );
    const n: Label = {
        type: 'Label',
        name: name
    };
    if (stepIf(s, '|')) {
        n.comment = parseComment(c, s, true);
    }
    readNewlines(s);
    return addLocation(c, s, s0, n) as Label;
}

export function parseLiteral(c: Context, s: State): Literal {
    const s0 = copyState(s);
    let value: string | number | boolean = '';
    if (curChar(s) !== '"' && curChar(s) !== "'") {
        let rawValue = readNonQuoteString(s, [']', '='].concat(pZs));
        let intValue = parseInt(rawValue);
        value =
            isFinite(intValue) && rawValue.match(/^[0-9]+$/) // only decimal
                ? intValue
                : rawValue;
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
    } else {
        value = readQuotedString(c, s);
        stepChar(s);
    }
    const n: Literal = {
        type: 'Literal',
        value: value
    };

    return addLocation(c, s, s0, n) as Literal;
}

export function parseCommandParameter(c: Context, s: State): CommandParameter {
    let s0 = copyState(s);
    let key = parseIdentifier(c, s, [']', '='].concat(pZs).concat(EOL));
    readSpaces(s);
    let n: CommandParameter = {
        type: 'CommandParameter',
        name: key
    };
    if (stepIf(s, '=')) {
        readSpaces(s);
        n.value = parseLiteral(c, s);
    }

    return addLocation(c, s, s0, n) as CommandParameter;
}

function parseCommandContent(
    c: Context,
    s: State
): [Identifier, CommandParameter[]] {
    const r: CommandParameter[] = [];
    readSpaces(s);
    const i = parseIdentifier(c, s, [']', ''].concat(pZs).concat(EOL));

    readSpaces(s);
    while (!eolAhead(s) && curChar(s) !== ']') {
        r.push(parseCommandParameter(c, s));
        readSpaces(s);
    }
    return [i, r];
}

// EOL after Text is a command in KAGEX...
// So we read a more EOL at Command
export function parseCommand(c: Context, s: State): Command {
    let s0 = copyState(s);
    let name: Identifier = { type: 'Identifier', name: '' };
    let param: CommandParameter[] = [];
    if (stepIf(s, '@')) {
        [name, param] = parseCommandContent(c, s);
        readNewlines(s);
    } else if (stepIf(s, '[')) {
        [name, param] = parseCommandContent(c, s);
        stepIf(s, ']');
        if (nextIs(s, EOL)) readNewlines(s);
    } else {
        e(s, 'parseCommand fail');
    }
    const n: Command = {
        type: 'Command',
        name: name,
        parameters: param
    };
    return addLocation(c, s, s0, n) as Command;
}

export function parseLiteralFromNonQuotedString(
    c: Context,
    s: State,
    end: string | string[]
): Literal {
    let s0 = copyState(s);
    const i: Literal = {
        type: 'Literal',
        value: readNonQuoteString(s, end)
    };
    return addLocation(c, s, s0, i) as Literal;
}

export function parseCookedText(c: Context, s: State): CookedText {
    const s0 = copyState(s);
    const r: CookedText = {
        type: 'CookedText',
        said: {
            type: 'Literal',
            value: ''
        }
    };
    if (stepIf(s, CJKLSB)) {
        r.name = parseIdentifier(c, s, ['/', CJKRSB]);
        if (stepIf(s, '/')) {
            r.as = parseIdentifier(c, s, [CJKRSB]);
        }
        stepIf(s, CJKRSB);
    }
    r.said = parseLiteralFromNonQuotedString(
        c,
        s,
        ['*', '|', '@', '['].concat(EOL)
    );
    return addLocation(c, s, s0, r) as CookedText;
}

export function parseText(c: Context, s: State): Text {
    const s0 = copyState(s);
    const r: Text = {
        type: 'Text',
        raw: ''
    };
    if (!c.kagex) {
        r.raw = readNonQuoteString(s, ['*', '|', '@', '['].concat(EOL));
    } else {
        r.cooked = parseCookedText(c, s);
        r.raw = s.src.substring(s0.ptr, s.ptr);
    }
    return addLocation(c, s, s0, r) as Text;
}

export function eolTransform(c: Context, s: State): Command {
    const s0 = copyState(s);
    if (!stepIf(s, EOL)) e(s, 'Expect EOL');
    readNewlines(s);
    const n: Command = {
        type: 'Command',
        name: null,
        parameters: []
    };
    return addLocation(c, s, s0, n) as Command;
}

export function parseScript(c: Context, s: State): Script {
    const s0 = copyState(s);
    const st: Content[] = [];

    while (!nextIs(s, EOF)) {
        switch (curChar(s)) {
            case '[':
            case '@':
                st.push(parseCommand(c, s));
                break;
            case ';':
                const cmt = parseComment(c, s);
                if (c.commentInAST) st.push(cmt);
                break;
            case '*':
                st.push(parseLabel(c, s));
                break;
            case '\r':
            case '\n':
                const vcmd = eolTransform(c, s);
                if (c.kagex) st.push(vcmd);
                break;
            default:
                st.push(parseText(c, s));
                break;
        }
    }

    const n: Script = {
        type: 'Script',
        contents: st
    };
    return addLocation(c, s, s0, n) as Script;
}
