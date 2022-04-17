import { parseScript } from '../../src/parser';
import { initState, initContext } from '../../src/common';

describe('parser - script', () => {
    test('switch comment', () => {
        expect(
            parseScript(initContext(), initState(';')).contents[0].type
        ).toBe('Comment');
    });

    test('switch label', () => {
        expect(
            parseScript(initContext(), initState('*')).contents[0].type
        ).toBe('Label');
    });

    test('switch EOL \r', () => {
        expect(
            parseScript(initContext(), initState('\r')).contents[0].type
        ).toBe('Command');
    });

    test('switch EOL \n', () => {
        expect(
            parseScript(initContext(), initState('\n')).contents[0].type
        ).toBe('Command');
    });

    test('switch Command [', () => {
        expect(
            parseScript(initContext(), initState('[aaa]')).contents[0].type
        ).toBe('Command');
    });

    test('switch Command @', () => {
        expect(
            parseScript(initContext(), initState('@a')).contents[0].type
        ).toBe('Command');
    });

    test('Default Text', () => {
        expect(
            parseScript(initContext(), initState('a')).contents[0].type
        ).toBe('Text');
    });

    test("Non KAGEX, don't transform EOL", () => {
        expect(
            parseScript(initContext({ kagex: false }), initState('\r\n'))
                .contents.length
        ).toBe(0);
    });

    test('Comment in AST off', () => {
        expect(
            parseScript(initContext({ commentInAST: false }), initState(';'))
                .contents.length
        ).toBe(0);
    });
});
