import { parseComment } from '../../src/parser';
import { initContext, initState } from '../../src/common';
describe('parser - comment', () => {
    test('basic', () => {
        expect(parseComment(initContext(), initState(';asdfghjkl'))).toEqual({
            type: 'Comment',
            raw: 'asdfghjkl',
            start: 0,
            end: 10,
            loc: {
                start: { column: 0, line: 1 },
                end: { column: 10, line: 1 },
                source: ';asdfghjkl'
            }
        });
    });

    test('space', () => {
        expect(
            parseComment(initContext(), initState(';asdf ghjkl    \r\n'))
        ).toEqual({
            type: 'Comment',
            raw: 'asdf ghjkl',
            start: 0,
            end: 17,
            loc: {
                start: { column: 0, line: 1 },
                end: { column: 0, line: 2 },
                source: ';asdf ghjkl'
            }
        });
    });

    test('correct ending', () => {
        expect(
            parseComment(initContext(), initState(';asdf\r\n \r\nend here'))
        ).toEqual({
            type: 'Comment',
            raw: 'asdf',
            start: 0,
            end: 8,
            loc: {
                start: { column: 0, line: 1 },
                end: { column: 1, line: 2 },
                source: ';asdf'
            }
        });
    });

    test('fail', () => {
        expect(() => parseComment(initContext(), initState('a'))).toThrow();
    });
});
