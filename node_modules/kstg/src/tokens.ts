export const NUL = '\0';
export const BEL = '\x07';
export const BS = '\x08';
export const HT = '\x09';
export const LF = '\x0a';
export const VT = '\x0b';
export const FF = '\x0c';
export const CR = '\x0d';

export const CJKLSB = '【';
export const CJKRSB = '】';

// Special flag EOF
export const EOF = '';

export const EOL = [EOF, CR, LF, CR + LF];

export const pZs = [
    '\u0020',
    '\u00a0',
    '\u1680',
    '\u2000',
    '\u2001',
    '\u2002',
    '\u2003',
    '\u2004',
    '\u2005',
    '\u2006',
    '\u2007',
    '\u2008',
    '\u2009',
    '\u200a',
    '\u202f',
    '\u205f',
    '\u3000'
];
