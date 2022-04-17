import { Node } from './kstree';

export interface Context {
    loc?: boolean;
    range?: boolean;

    unicodeEscape?: boolean;
    noCommentLabel?: boolean;

    kagex?: boolean;
    commentInAST?: boolean;
}

export interface State {
    src: string; // source string
    ptr: number; // read pointer
    line: number;
    column: number;
}

export function initState(src: string): State {
    return {
        src: src,
        ptr: 0,
        line: 1,
        column: 0
    };
}

export function copyState(s: State): State {
    return JSON.parse(JSON.stringify(s));
}

export function initContext(ctx: Context = {}): Context {
    const defaultCtx: Context = {
        loc: true,
        range: true,
        unicodeEscape: true,
        noCommentLabel: true,
        kagex: true,
        commentInAST: true
    };
    return Object.assign(defaultCtx, ctx);
}

export function e(state: State, msg: string): never {
    throw new SyntaxError(`Error at (${state.line},${state.column}):` + msg);
}

export function addLocation(c: Context, s: State, s0: State, node: Node): Node {
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
