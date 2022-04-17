import { State, e, Context } from './common';
import { NUL, BS, BEL, HT, LF, VT, FF, CR, pZs } from './tokens';

function splitByNewline(str: string): string[] {
    return str.split('\r\n').reduce((p: string[], s): string[] => {
        p.push(...s.split(/\r|\n/));
        return p;
    }, []);
}

export function stepLocation(s: State, step = 1): void {
    const jumped = s.src.substr(s.ptr, step);
    const lines = splitByNewline(jumped);
    s.line += lines.length - 1;
    if (lines.length > 1) s.column = 0;
    s.column += (lines.pop() || []).length;
    s.ptr += step;
}

function strParamToArray(str: string | string[]): string[] {
    const r =
        typeof str === 'string'
            ? [str]
            : // match longest prefix
              str.sort((a: string, b: string): number => b.length - a.length);
    return r;
}

/**
 * Check next string, without step
 * @param s
 * @param str
 */
export function nextIs(s: State, str: string | string[]): boolean {
    const _str = strParamToArray(str);
    for (const _s of _str) {
        if (!_s) {
            // check eof
            if (s.src.substr(s.ptr).length == 0) return true;
            else break;
        }
        const actual = s.src.substr(s.ptr, _s.length);
        if (actual === _s) return true;
    }
    return false;
}

/**
 * Step if next string match
 * @param s
 * @param str
 */
export function stepIf(s: State, str: string | string[]): boolean {
    const _str = strParamToArray(str);
    for (const _s of _str) {
        if (nextIs(s, _s)) {
            stepLocation(s, _s.length);
            return true;
        }
    }
    return false;
}

/**
 * Get current character
 * @param s
 */
export function curChar(s: State): string {
    if (s.ptr > s.src.length) e(s, 'Current char Read over EOF');
    return s.src[s.ptr];
}

/**
 * Get next char
 * @param s
 */
export function nextChar(s: State): string {
    if (s.ptr + 1 > s.src.length) e(s, 'Next char Read over EOF');
    return s.src[s.ptr + 1];
}

/**
 * Step to next character and return it
 * @param s
 */
export function stepChar(s: State): string {
    stepLocation(s, 1);
    return curChar(s);
}

export function isSpace(str: string): boolean {
    if (str === undefined) return false;
    // ('\p{Zs}') Seems they supported it.
    // No, they don't... V8 only?
    else return str.split('').every((k: string): boolean => pZs.includes(k));
}

export function eolAhead(s: State): boolean {
    return nextIs(s, ['\r', '\n']) || curChar(s) === undefined;
}

export function readNonQuoteString(s: State, until: string | string[]): string {
    let ret = '';
    let _until = strParamToArray(until);
    while (!nextIs(s, _until)) {
        ret += curChar(s);
        stepLocation(s);
    }
    return ret;
}

export function readSpaces(s: State): void {
    while (isSpace(curChar(s))) {
        stepLocation(s);
    }
}

export function readNewline(s: State): boolean {
    return stepIf(s, '\r\n') ? true : stepIf(s, ['\r', '\n']);
}

export function readNewlines(s: State): void {
    while (readNewline(s) ? true : readSpaces(s));
}

export function readEscapeSequence(c: Context, s: State): string {
    if (!stepIf(s, '\\')) e(s, 'Expected Escape sequence:' + curChar(s));
    const ch = curChar(s);
    switch (ch) {
        case 'u':
            if (!c.unicodeEscape) e(s, '\\u support disabled');
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
            } else {
                cpStr += digit1;
                cpStr += stepChar(s);
                cpStr += stepChar(s);
                cpStr += stepChar(s);
                stepChar(s);
            }
            if (!cpStr.match(/^[0-9a-f]+$/i)) {
                e(s, 'Unexpected Unicode codepoint');
            }
            const cpNum = parseInt(cpStr, 16);
            return String.fromCodePoint(cpNum);
        case 'x':
            // TJS Unicode
            // \xu{1,4},max match
            let xStr = '';
            for (let p = 0; p < 4; p++) {
                let nch = nextChar(s);
                if (nch === undefined || !nch.match(/^[0-9a-f]+$/i)) break;
                xStr += nch;
                stepChar(s);
            }
            stepChar(s);
            const xNum = parseInt(xStr, 16);
            return String.fromCodePoint(xNum);
        default:
            const convMap: {
                [key: string]: string;
            } = {
                '0': NUL,
                a: BEL, // \a defined in TJS
                b: BS,
                f: FF,
                n: LF,
                r: CR,
                t: HT,
                v: VT
            };
            const mch = convMap[ch];
            stepChar(s);
            if (mch === undefined) {
                return ch;
            } else return mch;
    }
}

export function readQuotedString(c: Context, s: State): string {
    const q = curChar(s);
    if (q !== '"' && q !== "'") {
        e(s, 'Unexpected quote char, actual:' + q);
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
                e(s, 'newline is not allowed');
            default:
                r += curChar(s);
                stepChar(s);
                break;
        }
    }
    return r;
}
