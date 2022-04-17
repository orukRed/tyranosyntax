import { initState, initContext } from '../../src/common';
import { parseLabel } from '../../src/parser';

describe('parser - label', () => {
    test('basic', () => {
        var s = initState('*tag|cmt\r\n');
        const l = parseLabel(initContext(), s);
        expect(l).toEqual({
            type: 'Label',
            name: {
                type: 'Identifier',
                name: 'tag',
                start: 1,
                end: 4,
                loc: {
                    start: { line: 1, column: 1 },
                    end: { line: 1, column: 4 },
                    source: 'tag'
                }
            },
            comment: {
                type: 'Comment',
                raw: 'cmt',
                start: 5,
                end: 10,
                loc: {
                    start: { line: 1, column: 5 },
                    end: { line: 2, column: 0 },
                    source: 'cmt'
                }
            },
            start: 0,
            end: 10,
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 2, column: 0 },
                source: '*tag|cmt'
            }
        });
    });

    test('more comment', () => {
        var s = initState('*tag|cmt ; more');
        const l = parseLabel(initContext(), s);
        expect(l).toEqual({
            type: 'Label',
            name: {
                type: 'Identifier',
                name: 'tag',
                start: 1,
                end: 4,
                loc: {
                    start: { line: 1, column: 1 },
                    end: { line: 1, column: 4 },
                    source: 'tag'
                }
            },
            comment: {
                type: 'Comment',
                raw: 'cmt ; more',
                start: 5,
                end: 15,
                loc: {
                    start: { line: 1, column: 5 },
                    end: { line: 1, column: 15 },
                    source: 'cmt ; more'
                }
            },
            start: 0,
            end: 15,
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 15 },
                source: '*tag|cmt ; more'
            }
        });
    });

    test('twice', () => {
        var s = initState('*tag|cmt\r\n\r\n*tag2|cmt\r\n');
        let c = initContext();
        expect(parseLabel(c, s)).toEqual({
            type: 'Label',
            name: {
                type: 'Identifier',
                name: 'tag',
                start: 1,
                end: 4,
                loc: {
                    start: { line: 1, column: 1 },
                    end: { line: 1, column: 4 },
                    source: 'tag'
                }
            },
            comment: {
                type: 'Comment',
                raw: 'cmt',
                start: 5,
                end: 12,
                loc: {
                    start: { line: 1, column: 5 },
                    end: { line: 3, column: 0 },
                    source: 'cmt'
                }
            },
            start: 0,
            end: 12,
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 3, column: 0 },
                source: '*tag|cmt'
            }
        });
        expect(parseLabel(c, s)).toEqual({
            type: 'Label',
            name: {
                type: 'Identifier',
                name: 'tag2',
                start: 13,
                end: 17,
                loc: {
                    start: { line: 3, column: 1 },
                    end: { line: 3, column: 5 },
                    source: 'tag2'
                }
            },
            comment: {
                type: 'Comment',
                raw: 'cmt',
                start: 18,
                end: 23,
                loc: {
                    start: { line: 3, column: 6 },
                    end: { line: 4, column: 0 },
                    source: 'cmt'
                }
            },
            start: 12,
            end: 23,
            loc: {
                start: { line: 3, column: 0 },
                end: { line: 4, column: 0 },
                source: '*tag2|cmt'
            }
        });
    });

    test('no comment', () => {
        var s = initState('*tag\n');
        const l = parseLabel(initContext(), s);
        expect(l).toEqual({
            type: 'Label',
            name: {
                type: 'Identifier',
                name: 'tag',
                start: 1,
                end: 4,
                loc: {
                    start: { line: 1, column: 1 },
                    end: { line: 1, column: 4 },
                    source: 'tag'
                }
            },
            start: 0,
            end: 5,
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 2, column: 0 },
                source: '*tag'
            }
        });
    });

    test('no comment disabled', () => {
        var s = initState('*tag\n');
        expect(() =>
            parseLabel(initContext({ noCommentLabel: false }), s)
        ).toThrow();
    });
});
