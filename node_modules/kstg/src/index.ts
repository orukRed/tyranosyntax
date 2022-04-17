import { Script } from './kstree';
import { initContext, initState, Context } from './common';
import { parseScript } from './parser';

export function parse(src: string, ctx?: Context): Script {
    const c = initContext(ctx || {});
    const s = initState(src);

    const p = parseScript(c, s);
    return p;
}
