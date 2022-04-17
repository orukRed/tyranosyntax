import { initState, initContext } from '../../src/common';
import { parseCommand, eolTransform } from '../../src/parser';

describe('parser - command', () => {
    describe('@', () => {
        test('basic, start with at', () => {
            const s = initState('@name');
            const c = initContext();

            expect(parseCommand(c, s)).toEqual({
                type: 'Command',
                name: {
                    type: 'Identifier',
                    name: 'name',
                    start: 1,
                    end: 5,
                    loc: {
                        start: { column: 1, line: 1 },
                        end: { column: 5, line: 1 },
                        source: 'name'
                    }
                },
                parameters: [],
                start: 0,
                end: 5,
                loc: {
                    end: { column: 5, line: 1 },
                    source: '@name',
                    start: { column: 0, line: 1 }
                }
            });
        });

        test('one param', () => {
            const s = initState('@name p1');
            const c = initContext();

            expect(parseCommand(c, s)).toEqual({
                type: 'Command',
                name: {
                    type: 'Identifier',
                    name: 'name',
                    start: 1,
                    end: 5,
                    loc: {
                        start: { column: 1, line: 1 },
                        end: { column: 5, line: 1 },
                        source: 'name'
                    }
                },
                parameters: [
                    {
                        type: 'CommandParameter',
                        name: {
                            type: 'Identifier',
                            name: 'p1',
                            start: 6,
                            end: 8,
                            loc: {
                                start: { column: 6, line: 1 },
                                end: { column: 8, line: 1 },
                                source: 'p1'
                            }
                        },
                        value: undefined,
                        start: 6,
                        end: 8,
                        loc: {
                            start: { line: 1, column: 6 },
                            end: { line: 1, column: 8 },
                            source: 'p1'
                        }
                    }
                ],
                start: 0,
                end: 8,
                loc: {
                    end: { column: 8, line: 1 },
                    source: '@name p1',
                    start: { column: 0, line: 1 }
                }
            });
        });

        test('some param', () => {
            const s = initState('@name p1 p2 = str p3');
            const c = initContext();

            expect(parseCommand(c, s)).toEqual({
                type: 'Command',
                name: {
                    type: 'Identifier',
                    name: 'name',
                    start: 1,
                    end: 5,
                    loc: {
                        start: { column: 1, line: 1 },
                        end: { column: 5, line: 1 },
                        source: 'name'
                    }
                },
                parameters: [
                    {
                        type: 'CommandParameter',
                        name: {
                            type: 'Identifier',
                            name: 'p1',
                            start: 6,
                            end: 8,
                            loc: {
                                start: { column: 6, line: 1 },
                                end: { column: 8, line: 1 },
                                source: 'p1'
                            }
                        },
                        start: 6,
                        end: 9,
                        loc: {
                            start: { line: 1, column: 6 },
                            end: { line: 1, column: 9 },
                            source: 'p1'
                        }
                    },
                    {
                        type: 'CommandParameter',
                        name: {
                            type: 'Identifier',
                            name: 'p2',
                            start: 9,
                            end: 11,
                            loc: {
                                start: { column: 9, line: 1 },
                                end: { column: 11, line: 1 },
                                source: 'p2'
                            }
                        },
                        value: {
                            type: 'Literal',
                            value: 'str',
                            start: 14,
                            end: 17,
                            loc: {
                                start: { line: 1, column: 14 },
                                end: { line: 1, column: 17 },
                                source: 'str'
                            }
                        },
                        start: 9,
                        end: 17,
                        loc: {
                            start: { line: 1, column: 9 },
                            end: { line: 1, column: 17 },
                            source: 'p2 = str'
                        }
                    },
                    {
                        type: 'CommandParameter',
                        name: {
                            type: 'Identifier',
                            name: 'p3',
                            start: 18,
                            end: 20,
                            loc: {
                                start: { column: 18, line: 1 },
                                end: { column: 20, line: 1 },
                                source: 'p3'
                            }
                        },
                        value: undefined,
                        start: 18,
                        end: 20,
                        loc: {
                            start: { line: 1, column: 18 },
                            end: { line: 1, column: 20 },
                            source: 'p3'
                        }
                    }
                ],
                start: 0,
                end: 20,
                loc: {
                    end: { column: 20, line: 1 },
                    source: '@name p1 p2 = str p3',
                    start: { column: 0, line: 1 }
                }
            });
        });
    });
    describe('[]', () => {
        test('basic', () => {
            const s = initState('[name]\n\n\n');
            const c = initContext();

            expect(parseCommand(c, s)).toEqual({
                type: 'Command',
                name: {
                    type: 'Identifier',
                    name: 'name',
                    start: 1,
                    end: 5,
                    loc: {
                        start: { column: 1, line: 1 },
                        end: { column: 5, line: 1 },
                        source: 'name'
                    }
                },
                parameters: [],
                start: 0,
                end: 9,
                loc: {
                    end: { column: 0, line: 4 },
                    source: '[name]',
                    start: { column: 0, line: 1 }
                }
            });
        });

        test('one param', () => {
            const s = initState('[  name p1]');
            const c = initContext();

            expect(parseCommand(c, s)).toEqual({
                type: 'Command',
                name: {
                    type: 'Identifier',
                    name: 'name',
                    start: 3,
                    end: 7,
                    loc: {
                        start: { column: 3, line: 1 },
                        end: { column: 7, line: 1 },
                        source: 'name'
                    }
                },
                parameters: [
                    {
                        type: 'CommandParameter',
                        name: {
                            type: 'Identifier',
                            name: 'p1',
                            start: 8,
                            end: 10,
                            loc: {
                                start: { column: 8, line: 1 },
                                end: { column: 10, line: 1 },
                                source: 'p1'
                            }
                        },
                        value: undefined,
                        start: 8,
                        end: 10,
                        loc: {
                            start: { line: 1, column: 8 },
                            end: { line: 1, column: 10 },
                            source: 'p1'
                        }
                    }
                ],
                start: 0,
                end: 11,
                loc: {
                    end: { column: 11, line: 1 },
                    source: '[  name p1]',
                    start: { column: 0, line: 1 }
                }
            });
        });

        test('some param', () => {
            const s = initState('[name p1 p2 = str p3 ]');
            const c = initContext();

            expect(parseCommand(c, s)).toEqual({
                type: 'Command',
                name: {
                    type: 'Identifier',
                    name: 'name',
                    start: 1,
                    end: 5,
                    loc: {
                        start: { column: 1, line: 1 },
                        end: { column: 5, line: 1 },
                        source: 'name'
                    }
                },
                parameters: [
                    {
                        type: 'CommandParameter',
                        name: {
                            type: 'Identifier',
                            name: 'p1',
                            start: 6,
                            end: 8,
                            loc: {
                                start: { line: 1, column: 6 },
                                end: { line: 1, column: 8 },
                                source: 'p1'
                            }
                        },
                        start: 6,
                        end: 9,
                        loc: {
                            start: { line: 1, column: 6 },
                            end: { line: 1, column: 9 },
                            source: 'p1'
                        }
                    },
                    {
                        type: 'CommandParameter',
                        name: {
                            type: 'Identifier',
                            name: 'p2',
                            start: 9,
                            end: 11,
                            loc: {
                                start: { line: 1, column: 9 },
                                end: { line: 1, column: 11 },
                                source: 'p2'
                            }
                        },
                        value: {
                            type: 'Literal',
                            value: 'str',
                            start: 14,
                            end: 17,
                            loc: {
                                start: { line: 1, column: 14 },
                                end: { line: 1, column: 17 },
                                source: 'str'
                            }
                        },
                        start: 9,
                        end: 17,
                        loc: {
                            start: { line: 1, column: 9 },
                            end: { line: 1, column: 17 },
                            source: 'p2 = str'
                        }
                    },
                    {
                        type: 'CommandParameter',
                        name: {
                            name: 'p3',
                            type: 'Identifier',
                            start: 18,
                            end: 20,
                            loc: {
                                start: { line: 1, column: 18 },
                                end: { line: 1, column: 20 },
                                source: 'p3'
                            }
                        },
                        value: undefined,
                        start: 18,
                        end: 21,
                        loc: {
                            start: { line: 1, column: 18 },
                            end: { line: 1, column: 21 },
                            source: 'p3'
                        }
                    }
                ],
                start: 0,
                end: 22,
                loc: {
                    end: { column: 22, line: 1 },
                    source: '[name p1 p2 = str p3 ]',
                    start: { column: 0, line: 1 }
                }
            });
        });

        test('correct end', () => {
            expect(parseCommand(initContext(), initState('[a]b')).end).toBe(3);
        });
    });

    test('unexpected start', () => {
        expect(() => parseCommand(initContext(), initState('aaa'))).toThrow();
    });

    describe('EOL virtual cmd', () => {
        test('basic', () => {
            expect(eolTransform(initContext(), initState('\r\n'))).toEqual({
                end: 2,
                loc: {
                    end: { column: 0, line: 2 },
                    source: '',
                    start: { column: 0, line: 1 }
                },
                name: null,
                parameters: [],
                start: 0,
                type: 'Command'
            });
        });
        test('fail', () => {
            expect(() =>
                eolTransform(initContext(), initState('1\r\n'))
            ).toThrow();
        });
    });
});
