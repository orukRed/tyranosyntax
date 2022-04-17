/* KAG Script Syntax Tree for JavaScript */
/* eslint-disable @typescript-eslint/class-name-casing*/
// This is same as ESTree
export interface _Node<T extends string> {
    type: T;
    loc?: SourceLocation | null;
    start?: number;
    end?: number;
}

export interface SourceLocation {
    start: Position;
    end: Position;
    source?: string;
}

export interface Position {
    /** >= 1 */
    line: number;
    /** >= 0 */
    column: number;
}

export type Node =
    | Script
    | Content
    | CommandParameter
    | Literal
    | Identifier
    | CookedText;

export interface Script extends _Node<'Script'> {
    flavor?: 'vanilla' | 'yuzusoft'; //  kag|kagex?
    contents: Content[];
}

// Keep comments in it for further extending
export type Content = Command | Text | Label | Comment;

export interface Command extends _Node<'Command'> {
    name: Identifier | null; // null: crlf virtual command
    parameters: CommandParameter[];
    raw?: string;
}

export interface CommandParameter extends _Node<'CommandParameter'> {
    name: Identifier;
    value?: Literal; // undefined means no value used
}

export interface Text extends _Node<'Text'> {
    raw: string; // always keep raw string
    cooked?: CookedText; // KAGEX only
}

export interface CookedText extends _Node<'CookedText'> {
    name?: Identifier;
    as?: Identifier;
    said: Literal;
}

export interface Label extends _Node<'Label'> {
    name: Identifier;
    comment?: Comment;
}

export interface Comment extends _Node<'Comment'> {
    raw: string;
}

export interface Identifier extends _Node<'Identifier'> {
    name: string;
}

export interface Literal extends _Node<'Literal'> {
    value: string | number | boolean;
}
