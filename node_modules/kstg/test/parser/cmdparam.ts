import { initContext, initState } from '../../src/common';
import { parseCommandParameter } from '../../src/parser';

describe('parser - command parameter', () => {
    test('without value', () => {
        let c = initContext();
        let s = initState('t a');
        expect(parseCommandParameter(c, s)).toEqual({
            type: 'CommandParameter',
            name: {
                type: 'Identifier',
                name: 't',
                start: 0,
                end: 1,
                loc: {
                    start: { column: 0, line: 1 },
                    end: { column: 1, line: 1 },
                    source: 't'
                }
            },
            value: undefined,
            loc: {
                end: { column: 2, line: 1 },
                source: 't',
                start: { column: 0, line: 1 }
            },
            start: 0,
            end: 2
        });
    });

    test('with value', () => {
        let c = initContext();
        let s = initState('t = a123 ');
        expect(parseCommandParameter(c, s)).toEqual({
            type: 'CommandParameter',
            name: {
                type: 'Identifier',
                name: 't',
                start: 0,
                end: 1,
                loc: {
                    start: { column: 0, line: 1 },
                    end: { column: 1, line: 1 },
                    source: 't'
                }
            },
            value: {
                type: 'Literal',
                value: 'a123',

                start: 4,
                end: 8,
                loc: {
                    start: { line: 1, column: 4 },
                    end: { line: 1, column: 8 },
                    source: 'a123'
                }
            },
            start: 0,
            end: 8,
            loc: {
                end: { column: 8, line: 1 },
                source: 't = a123',
                start: { column: 0, line: 1 }
            }
        });
    });

    test('quoted value', () => {
        let c = initContext();
        let s = initState('t = "123" ');
        expect(parseCommandParameter(c, s)).toEqual({
            type: 'CommandParameter',
            name: {
                type: 'Identifier',
                name: 't',
                start: 0,
                end: 1,
                loc: {
                    start: { column: 0, line: 1 },
                    end: { column: 1, line: 1 },
                    source: 't'
                }
            },
            value: {
                type: 'Literal',
                value: '123',

                start: 4,
                end: 9,
                loc: {
                    start: { line: 1, column: 4 },
                    end: { line: 1, column: 9 },
                    source: '"123"'
                }
            },
            start: 0,
            end: 9,
            loc: {
                end: { column: 9, line: 1 },
                source: 't = "123"',
                start: { column: 0, line: 1 }
            }
        });
    });

    test('convert number', () => {
        let c = initContext();
        let s = initState('t = 123 ');
        expect(parseCommandParameter(c, s)).toEqual({
            type: 'CommandParameter',
            name: {
                type: 'Identifier',
                name: 't',
                start: 0,
                end: 1,
                loc: {
                    start: { column: 0, line: 1 },
                    end: { column: 1, line: 1 },
                    source: 't'
                }
            },
            value: {
                type: 'Literal',
                value: 123,

                start: 4,
                end: 7,
                loc: {
                    start: { line: 1, column: 4 },
                    end: { line: 1, column: 7 },
                    source: '123'
                }
            },
            start: 0,
            end: 7,
            loc: {
                end: { column: 7, line: 1 },
                source: 't = 123',
                start: { column: 0, line: 1 }
            }
        });
    });

    test('equalsign without space', () => {
        let c = initContext();
        let s = initState('t=123 ');
        expect(parseCommandParameter(c, s)).toEqual({
            type: 'CommandParameter',
            name: {
                type: 'Identifier',
                name: 't',
                start: 0,
                end: 1,
                loc: {
                    start: { column: 0, line: 1 },
                    end: { column: 1, line: 1 },
                    source: 't'
                }
            },
            value: {
                type: 'Literal',
                value: 123,

                start: 2,
                end: 5,
                loc: {
                    start: { line: 1, column: 2 },
                    end: { line: 1, column: 5 },
                    source: '123'
                }
            },
            start: 0,
            end: 5,
            loc: {
                end: { column: 5, line: 1 },
                source: 't=123',
                start: { column: 0, line: 1 }
            }
        });
    });

    test('boolean literal true', () => {
        let c = initContext();
        let s = initState('t=true ');
        expect(parseCommandParameter(c, s)).toEqual({
            type: 'CommandParameter',
            name: {
                type: 'Identifier',
                name: 't',
                start: 0,
                end: 1,
                loc: {
                    start: { column: 0, line: 1 },
                    end: { column: 1, line: 1 },
                    source: 't'
                }
            },
            value: {
                type: 'Literal',
                value: true,

                start: 2,
                end: 6,
                loc: {
                    start: { line: 1, column: 2 },
                    end: { line: 1, column: 6 },
                    source: 'true'
                }
            },
            start: 0,
            end: 6,
            loc: {
                end: { column: 6, line: 1 },
                source: 't=true',
                start: { column: 0, line: 1 }
            }
        });
    });

    test('boolean literal false', () => {
        let c = initContext();
        let s = initState('t=false ');
        expect(parseCommandParameter(c, s)).toEqual({
            type: 'CommandParameter',
            name: {
                type: 'Identifier',
                name: 't',
                start: 0,
                end: 1,
                loc: {
                    start: { column: 0, line: 1 },
                    end: { column: 1, line: 1 },
                    source: 't'
                }
            },
            value: {
                type: 'Literal',
                value: false,

                start: 2,
                end: 7,
                loc: {
                    start: { line: 1, column: 2 },
                    end: { line: 1, column: 7 },
                    source: 'false'
                }
            },
            start: 0,
            end: 7,
            loc: {
                end: { column: 7, line: 1 },
                source: 't=false',
                start: { column: 0, line: 1 }
            }
        });
    });
});
