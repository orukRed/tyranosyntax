import { initContext, initState } from '../src/common';
import { parseCommand, parseIdentifier } from '../src/parser';
import { parse } from '../src';

/* Just try to achieve 100% coverage*/

describe('other', () => {
    test('disable location data', () => {
        const r = parseCommand(
            initContext({ range: false, loc: false }),
            initState('[a]')
        );
        expect(r).not.toHaveProperty('loc');
        expect(r).not.toHaveProperty('start');
        expect(r).not.toHaveProperty('end');
    });

    test('read identifier until eol', () => {
        expect(parseIdentifier(initContext(), initState('aaa\nbbbb'))).toEqual({
            type: 'Identifier',
            name: 'aaa',

            start: 0,
            end: 3,
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 3 },
                source: 'aaa'
            }
        });
    });

    test('parser accepts undefined context', () => {
        expect(() => parse('[a]')).not.toThrow();
    });
});
