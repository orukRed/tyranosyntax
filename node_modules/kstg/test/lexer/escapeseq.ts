import { readEscapeSequence } from '../../src/lexer';
import { initState, initContext } from '../../src/common';
import { BEL, BS, HT, LF, VT, FF, CR } from '../../src/tokens';

describe('string escape', () => {
    test('check invalid', () => {
        expect(() =>
            readEscapeSequence(initContext(), initState('must start with \\'))
        ).toThrow();
    });
    describe('u', () => {
        test('basic', () => {
            expect(
                readEscapeSequence(initContext(), initState('\\u4e00'))
            ).toBe('一');
        });
        test('twice', () => {
            let s = initState('\\u4e01\\u4e00');
            let c = initContext();
            expect(readEscapeSequence(c, s)).toBe('丁');
            expect(readEscapeSequence(c, s)).toBe('一');
        });
        test('bracketed', () => {
            let s = initState('\\u{4e01}\\u{414}');
            expect(readEscapeSequence(initContext(), s)).toBe('丁');
            expect(readEscapeSequence(initContext(), s)).toBe('Д');
        });

        test('correct step', () => {
            let s = initState('\\u1234');
            readEscapeSequence(initContext(), s);
            expect(s.ptr).toBe(6);
        });

        test('non hex', () => {
            let c = initContext();
            expect(() => readEscapeSequence(c, initState('\\u{4q}'))).toThrow();
            expect(() => readEscapeSequence(c, initState('\\u4q17'))).toThrow();
        });

        test('non number should fail', () => {
            expect(() =>
                readEscapeSequence(initContext(), initState('\\u\\u1234'))
            ).toThrow();
        });

        test('when \\u disabled should fail', () => {
            expect(() =>
                readEscapeSequence(
                    initContext({ unicodeEscape: false }),
                    initState('\\u')
                )
            ).toThrow();
        });
    });

    describe('x', () => {
        test('basic', () => {
            expect(
                readEscapeSequence(initContext(), initState('\\x4e00'))
            ).toBe('一');
        });

        test('twice', () => {
            let s = initState('\\x4e01\\x4e00');
            let c = initContext();
            expect(readEscapeSequence(c, s)).toBe('丁');
            expect(readEscapeSequence(c, s)).toBe('一');
        });
        test('limit digit', () => {
            let s = initState('\\x4e0123456');
            expect(readEscapeSequence(initContext(), s)).toBe('丁');
            expect(s.ptr).toBe(6);
        });

        test('early limit digit with \\', () => {
            let s = initState('\\x4e\\x4ek');
            let c = initContext();
            expect(readEscapeSequence(c, s)).toBe('N');
            expect(readEscapeSequence(c, s)).toBe('N');
            expect(s.ptr).toBe(8);
        });

        test('early limit digit with char', () => {
            let s = initState('\\x4ekaaa');
            expect(readEscapeSequence(initContext(), s)).toBe('N');
            expect(s.ptr).toBe(4);
        });

        test('correct step', () => {
            const s = initState('\\x1234');
            readEscapeSequence(initContext(), s);
            expect(s.ptr).toBe(6);
        });
    });

    describe('alpha', () => {
        test('normal', () => {
            const c = initContext();
            expect(readEscapeSequence(c, initState('\\a'))).toBe(BEL);
            expect(readEscapeSequence(c, initState('\\b'))).toBe(BS);
            expect(readEscapeSequence(c, initState('\\t'))).toBe(HT);
            expect(readEscapeSequence(c, initState('\\n'))).toBe(LF);
            expect(readEscapeSequence(c, initState('\\v'))).toBe(VT);
            expect(readEscapeSequence(c, initState('\\f'))).toBe(FF);
            expect(readEscapeSequence(c, initState('\\r'))).toBe(CR);
        });

        test('special', () => {
            const c = initContext();
            expect(readEscapeSequence(c, initState('\\0'))).toBe('\0');
            expect(readEscapeSequence(c, initState('\\"'))).toBe('"');
            expect(readEscapeSequence(c, initState("\\'"))).toBe("'");
            expect(readEscapeSequence(c, initState('\\\\'))).toBe('\\');
        });

        test('correct step', () => {
            const s = initState("\\'\\0");
            const c = initContext();
            expect(readEscapeSequence(c, s)).toBe("'");
            expect(s.ptr).toBe(2);
            expect(readEscapeSequence(c, s)).toBe('\0');
            expect(s.ptr).toBe(4);
        });

        test("don't escape", () => {
            const c = initContext();
            expect(readEscapeSequence(c, initState('\\江'))).toBe('江');
            expect(readEscapeSequence(c, initState('\\z'))).toBe('z');
        });

        test('continuous', () => {
            const s = initState('\\'.repeat(4));
            const c = initContext();
            expect(readEscapeSequence(c, s)).toBe('\\');
            expect(readEscapeSequence(c, s)).toBe('\\');
        });
    });
});
