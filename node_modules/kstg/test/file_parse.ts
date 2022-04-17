/* Parse test/examples/*.ks, (done)
use test/examples/*-config.json if exist,
compare with test/example/*-expected.json if exist
*/
import { parse } from '../src/index';
import { readdirSync, readFileSync } from 'fs';

const exampleRoot = 'test/examples';
const f = readdirSync(exampleRoot);

interface TestItem {
    src: string;
    cfg?: string;
    ast?: string;
}

const testItems: TestItem[] = f
    .filter(n => n.match(/\.ks$/))
    .map(n => {
        const pfx = n.match(/(.+)\.ks/) || [][1];

        const ret: TestItem = {
            src: n
        };

        if (f.includes(pfx + '-config.json')) ret.cfg = pfx + '-config.json';
        if (f.includes(pfx + '-expected.json'))
            ret.ast = pfx + '-expected.json';
        return ret;
    });

testItems.forEach(i => {
    test(i.src, () => {
        const src = readFileSync(exampleRoot + '/' + i.src).toString();
        const cfg = i.cfg
            ? readFileSync(exampleRoot + '/' + i.cfg).toJSON()
            : {};

        if (i.ast) {
            const ast = readFileSync(exampleRoot + '/' + i.ast).toJSON();
            expect(parse(src, cfg)).toEqual(ast);
        } else {
            expect(() => parse(src, cfg)).not.toThrow();
        }
    });
});
