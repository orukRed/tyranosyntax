import { initState } from '../../src/common';
import {
    curChar,
    eolAhead,
    nextChar,
    nextIs,
    readSpaces,
    stepChar,
    stepIf,
    stepLocation
} from '../../src/lexer';

describe('lexer - pointer operation', () => {
    describe('nextIs', () => {
        test('empty string', () => {
            expect(nextIs(initState(''), 'a')).toBe(false);
            expect(nextIs(initState(''), '')).toBe(true);
        });

        test('single select', () => {
            expect(nextIs(initState('aa'), 'aa')).toBe(true);
            expect(nextIs(initState('aa'), 'b')).toBe(false);
            expect(nextIs(initState('aa'), 'a')).toBe(true);
        });

        test('multiple select', () => {
            expect(nextIs(initState('aa'), ['aa', 'fail'])).toBe(true);
            expect(nextIs(initState('aa'), ['b', 'fail'])).toBe(false);
            expect(nextIs(initState('aa'), ['a', 'fail'])).toBe(true);
        });

        test('empty string means eof', () => {
            expect(nextIs(initState(''), '')).toBe(true);
            expect(nextIs(initState('aa'), '')).toBe(false);
            let s = initState('aa');
            stepChar(s);
            stepChar(s);
            expect(nextIs(s, '')).toBe(true);
            expect(nextIs(initState('aa'), ['', 'fail'])).toBe(false);
        });
    });

    describe('stepLocation', () => {
        test('dos', () => {
            const s = initState('\r\n1\r\n');
            expect(s.line).toBe(1);
            expect(s.column).toBe(0);
            stepLocation(s, 5);
            expect(s.line).toBe(3); // end of line 2 is start of line 3
            expect(s.column).toBe(0);
        });

        test('unix', () => {
            const s = initState('1\n1\n');
            expect(s.line).toBe(1);
            expect(s.column).toBe(0);
            stepLocation(s, 4);
            expect(s.line).toBe(3);
            expect(s.column).toBe(0);
        });

        test('mac', () => {
            // I don't believe there's still any old mac format text.
            // Neither in Kirikiri, nor in 2019, but test it for safe
            const s = initState('1\r1\r');
            expect(s.line).toBe(1);
            expect(s.column).toBe(0);
            stepLocation(s, 4);
            expect(s.line).toBe(3);
            expect(s.column).toBe(0);
        });

        test('mix', () => {
            const s = initState('\n\n\r\n\r\n\r\r');
            expect(s.line).toBe(1);
            expect(s.column).toBe(0);
            stepLocation(s, 8);
            expect(s.line).toBe(7);
            expect(s.column).toBe(0);
        });
    });

    describe('stepIf', () => {
        test('empty string', () => {
            let s = initState('');
            expect(stepIf(s, 'a')).toBe(false);
            expect(s.ptr).toBe(0);
            // Stepped, but met eof
            expect(stepIf(s, '')).toBe(true);
            expect(s.ptr).toBe(0);
        });

        test('single select', () => {
            let s = initState('aa');
            expect(stepIf(s, 'aa')).toBe(true);
            expect(s.ptr).toBe(2);
            s = initState('aa');
            expect(stepIf(s, 'b')).toBe(false);
            expect(s.ptr).toBe(0);
            s = initState('aa');
            expect(stepIf(s, 'a')).toBe(true);
            expect(s.ptr).toBe(1);
        });

        test('multiple select', () => {
            let s = initState('aa');
            expect(stepIf(s, ['aa', 'fail'])).toBe(true);
            expect(s.ptr).toBe(2);
            s = initState('aa');
            expect(stepIf(s, ['b', 'fail'])).toBe(false);
            expect(s.ptr).toBe(0);
            s = initState('aa');
            expect(stepIf(s, ['a', 'fail'])).toBe(true);
            expect(s.ptr).toBe(1);
        });

        test('empty string means eof', () => {
            expect(stepIf(initState(''), '')).toBe(true);
            let s = initState('aa');
            expect(stepIf(s, '')).toBe(false);
            expect(s.ptr).toBe(0);
            s = initState('aa');
            stepIf(s, 'aa');
            expect(stepIf(s, '')).toBe(true);
            s = initState('aa');
            expect(stepIf(s, ['', 'fail'])).toBe(false);
            expect(s.ptr).toBe(0);
        });

        test('longest match', () => {
            let s = initState('1234567890');
            expect(stepIf(s, ['1', '123', '1235', '12'])).toBe(true);
            expect(s.ptr).toBe(3);
        });
    });

    describe('curChar', () => {
        test('eof is undefined', () => {
            expect(curChar(initState(''))).toBe(undefined);
            let s = initState('1234567890');
            stepLocation(s, 10);
            expect(curChar(s)).toBe(undefined);
        });

        test('read after eof will throw', () => {
            let s = initState('1234567890');
            stepLocation(s, 11);
            expect(() => curChar(s)).toThrow();
        });

        test('basic behavior', () => {
            let s = initState('1234567890');
            expect(curChar(s)).toBe('1');
            stepLocation(s);
            expect(curChar(s)).toBe('2');
        });
    });

    describe('nextChar', () => {
        test('eof is undefined', () => {
            // read 2nd char of empty string, results read over eof
            expect(() => nextChar(initState(''))).toThrow();
            let s = initState('1234567890');
            stepLocation(s, 9);
            expect(nextChar(s)).toBe(undefined);
        });

        test('read after eof will throw', () => {
            let s = initState('1234567890');
            stepLocation(s, 11);
            expect(() => nextChar(s)).toThrow();
        });

        test('basic behavior', () => {
            let s = initState('1234567890');
            expect(nextChar(s)).toBe('2');
            stepLocation(s);
            expect(nextChar(s)).toBe('3');
        });
    });

    describe('readSpace', () => {
        test('end with eof', () => {
            let s = initState('    ');
            readSpaces(s);
            expect(s.ptr).toBe(4);
        });

        test('end with token', () => {
            let s = initState('    aaa');
            readSpaces(s);
            expect(s.ptr).toBe(4);
        });

        test('end with eol', () => {
            let s = initState('    \n   ');
            readSpaces(s);
            expect(s.ptr).toBe(4);
        });

        test('tab is space', () => {
            let s = initState('    \t\n   ');
            readSpaces(s);
            expect(s.ptr).toBe(4);
        });
    });

    describe('eolAhead', () => {
        test('eof is', () => {
            expect(eolAhead(initState(''))).toBe(true);
        });
        test('cr is', () => {
            expect(eolAhead(initState('\r'))).toBe(true);
        });
        test('lf is', () => {
            expect(eolAhead(initState('\n'))).toBe(true);
        });
        test('crlf is', () => {
            expect(eolAhead(initState('\r\n'))).toBe(true);
        });
        test('space not', () => {
            expect(eolAhead(initState(' '))).toBe(false);
        });
    });
});
