import { initState, initContext } from '../../src/common';
import { parseText } from '../../src/parser';
describe('parser - text content', () => {
    const c = initContext();
    const nocook = initContext({ kagex: false });

    test('read until eol', () => {
        expect(
            parseText(nocook, initState('苟利国家生死以 岂因祸福避趋之\r\n'))
        ).toEqual({
            end: 15,
            loc: {
                end: { column: 15, line: 1 },
                source: '苟利国家生死以 岂因祸福避趋之',
                start: { column: 0, line: 1 }
            },
            raw: '苟利国家生死以 岂因祸福避趋之',
            start: 0,
            type: 'Text'
        });
    });

    test('read until command', () => {
        expect(
            parseText(
                nocook,
                initState('只是在想317后面的质数是什么[factor 331]')
            )
        ).toEqual({
            end: 15,
            loc: {
                end: { column: 15, line: 1 },
                source: '只是在想317后面的质数是什么',
                start: { column: 0, line: 1 }
            },
            raw: '只是在想317后面的质数是什么',
            start: 0,
            type: 'Text'
        });
    });

    test('kagex mode', () => {
        expect(
            parseText(
                c,
                initState('不不不，也不用这么守规矩地把【GPLv3】全读了')
            )
        ).toEqual({
            cooked: {
                end: 24,
                loc: {
                    end: { column: 24, line: 1 },
                    source: '不不不，也不用这么守规矩地把【GPLv3】全读了',
                    start: { column: 0, line: 1 }
                },
                said: {
                    end: 24,
                    loc: {
                        end: { column: 24, line: 1 },
                        source: '不不不，也不用这么守规矩地把【GPLv3】全读了',
                        start: { column: 0, line: 1 }
                    },
                    start: 0,
                    type: 'Literal',
                    value: '不不不，也不用这么守规矩地把【GPLv3】全读了'
                },
                start: 0,
                type: 'CookedText'
            },
            end: 24,
            loc: {
                end: { column: 24, line: 1 },
                source: '不不不，也不用这么守规矩地把【GPLv3】全读了',
                start: { column: 0, line: 1 }
            },
            raw: '不不不，也不用这么守规矩地把【GPLv3】全读了',
            start: 0,
            type: 'Text'
        });
    });

    test('kagex with name', () => {
        expect(
            parseText(
                c,
                initState(
                    '【夏莉】「不会的，不会的。我们好歹也算是装作在学习的样子」'
                )
            )
        ).toEqual({
            cooked: {
                end: 29,
                loc: {
                    end: { column: 29, line: 1 },
                    source:
                        '【夏莉】「不会的，不会的。我们好歹也算是装作在学习的样子」',
                    start: { column: 0, line: 1 }
                },
                name: {
                    end: 3,
                    loc: {
                        end: { column: 3, line: 1 },
                        source: '夏莉',
                        start: { column: 1, line: 1 }
                    },
                    name: '夏莉',
                    start: 1,
                    type: 'Identifier'
                },
                said: {
                    end: 29,
                    loc: {
                        end: { column: 29, line: 1 },
                        source:
                            '「不会的，不会的。我们好歹也算是装作在学习的样子」',
                        start: { column: 4, line: 1 }
                    },
                    start: 4,
                    type: 'Literal',
                    value: '「不会的，不会的。我们好歹也算是装作在学习的样子」'
                },
                start: 0,
                type: 'CookedText'
            },
            end: 29,
            loc: {
                end: { column: 29, line: 1 },
                source:
                    '【夏莉】「不会的，不会的。我们好歹也算是装作在学习的样子」',
                start: { column: 0, line: 1 }
            },
            raw: '【夏莉】「不会的，不会的。我们好歹也算是装作在学习的样子」',
            start: 0,
            type: 'Text'
        });
    });

    test('kagex with modified name', () => {
        expect(
            parseText(
                c,
                initState('【真咲/兽耳少女】「难道是阿宅？」[END HERE]')
            )
        ).toEqual({
            cooked: {
                as: {
                    end: 8,
                    loc: {
                        end: { column: 8, line: 1 },
                        source: '兽耳少女',
                        start: { column: 4, line: 1 }
                    },
                    name: '兽耳少女',
                    start: 4,
                    type: 'Identifier'
                },
                end: 17,
                loc: {
                    end: { column: 17, line: 1 },
                    source: '【真咲/兽耳少女】「难道是阿宅？」',
                    start: { column: 0, line: 1 }
                },
                name: {
                    end: 3,
                    loc: {
                        end: { column: 3, line: 1 },
                        source: '真咲',
                        start: { column: 1, line: 1 }
                    },
                    name: '真咲',
                    start: 1,
                    type: 'Identifier'
                },
                said: {
                    end: 17,
                    loc: {
                        end: { column: 17, line: 1 },
                        source: '「难道是阿宅？」',
                        start: { column: 9, line: 1 }
                    },
                    start: 9,
                    type: 'Literal',
                    value: '「难道是阿宅？」'
                },
                start: 0,
                type: 'CookedText'
            },
            end: 17,
            loc: {
                end: { column: 17, line: 1 },
                source: '【真咲/兽耳少女】「难道是阿宅？」',
                start: { column: 0, line: 1 }
            },
            raw: '【真咲/兽耳少女】「难道是阿宅？」',
            start: 0,
            type: 'Text'
        });
    });
});
