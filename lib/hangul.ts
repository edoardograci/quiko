// Hangul utility wrappers using hangul-js
// Note: hangul-js is a CommonJS module

export function disassemble(text: string): string[] {
    // Dynamic require for CJS compat in Next.js server context
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Hangul = require('hangul-js');
    return Hangul.disassemble(text);
}

export function assemble(jamo: string[]): string {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Hangul = require('hangul-js');
    return Hangul.assemble(jamo);
}

export function isHangul(char: string): boolean {
    const code = char.charCodeAt(0);
    return (code >= 0xAC00 && code <= 0xD7A3) || // syllable blocks
        (code >= 0x1100 && code <= 0x11FF) || // jamo
        (code >= 0x3130 && code <= 0x318F);   // compat jamo
}

export function isHangulString(str: string): boolean {
    return str.split('').every(c => isHangul(c) || c === ' ');
}

/**
 * Check if searchTerm is contained in target at the jamo level
 * Used for fuzzy Korean search
 */
export function jamoSearch(searchTerm: string, target: string): boolean {
    if (!searchTerm) return true;
    const searchJamo = disassemble(searchTerm).join('');
    const targetJamo = disassemble(target).join('');
    return targetJamo.includes(searchJamo);
}

export const POS_LABELS: Record<string, string> = {
    noun: '명사',
    verb: '동사',
    adjective: '형용사',
    adverb: '부사',
    particle: '조사',
    determiner: '관형사',
    interjection: '감탄사',
    number: '수사',
    pronoun: '대명사',
    bound_noun: '의존 명사',
    suffix: '접사',
};

export const LEVEL_COLORS: Record<string, string> = {
    'TOPIK-I': 'bg-blue-600 text-white border-blue-700 dark:bg-blue-500',
    'TOPIK-II': 'bg-purple-600 text-white border-purple-700 dark:bg-purple-500',
    'custom': 'bg-gray-600 text-white border-gray-700 dark:bg-gray-500',
    'A': 'bg-green-600 text-white border-green-700 dark:bg-green-500',
    'B': 'bg-yellow-600 text-white border-yellow-700 dark:bg-yellow-500',
};

export const MORPHEME_COLORS: Record<string, string> = {
    verb_stem: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-900 dark:text-blue-100',
    noun_stem: 'bg-green-100 text-green-900 border-green-300 dark:bg-green-900 dark:text-green-100',
    tense_marker: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900 dark:text-amber-100',
    aspect_ending: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-900 dark:text-purple-100',
    particle: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-900 dark:text-rose-100',
    honorific_marker: 'bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-900 dark:text-teal-100',
    connector: 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-900 dark:text-orange-100',
    ending: 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-100',
    other: 'bg-gray-100 text-gray-900 border-gray-300 dark:bg-gray-800 dark:text-gray-100',
};

export interface MorphemeToken {
    morpheme: string;
    type: string;
    label?: string;
}
