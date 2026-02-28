import { XMLParser } from 'fast-xml-parser';
import { db } from './db';
import { krdictCache } from './db/schema';
import { eq } from 'drizzle-orm';

const KRDICT_BASE_URL = 'https://krdict.korean.go.kr/api';

interface KrdictEntry {
    target_code: string;
    word: string;
    pos: string;
    sense: Array<{
        definition: string;
        translation?: Array<{ trans_word?: string; trans_dfn?: string }>;
        example?: Array<{ example: string }> | { example: string };
    }>;
    pronunciation?: string;
    pronunciation_info?: Array<{ pronunciation: string }>;
}

export interface DictResult {
    target_code: string;
    word: string;
    pos: string;
    pronunciation: string;
    definitions: Array<{
        order: number;
        definition_ko: string;
        definition_en?: string;
        examples: string[];
    }>;
}

function parseXml(xml: string): DictResult[] {
    const parser = new XMLParser({ ignoreAttributes: false, isArray: (name) => ['item', 'sense', 'pronunciation_info', 'example', 'translation'].includes(name) });
    const parsed = parser.parse(xml);

    const channel = parsed?.channel;
    if (!channel) return [];

    const items: KrdictEntry[] = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];

    return items.map((item) => {
        const senses = Array.isArray(item.sense) ? item.sense : item.sense ? [item.sense] : [];
        const pronInfo = Array.isArray(item.pronunciation_info) ? item.pronunciation_info : [];

        return {
            target_code: String(item.target_code || ''),
            word: item.word || '',
            pos: item.pos || '',
            pronunciation: pronInfo[0]?.pronunciation || item.pronunciation || item.word || '',
            definitions: senses.map((s, i) => {
                const examples = Array.isArray(s.example)
                    ? s.example.map((e) => e.example).filter(Boolean)
                    : s.example
                        ? [s.example]
                        : [];
                return {
                    order: i + 1,
                    definition_ko: s.definition || '',
                    definition_en: (s.translation && s.translation.length > 0) ? (s.translation[0].trans_dfn || s.translation[0].trans_word) : '',
                    examples: examples as string[],
                };
            }),
        };
    });
}

export async function searchKrdict(query: string): Promise<DictResult[]> {
    // Check cache first
    const cached = db.select().from(krdictCache).where(eq(krdictCache.query, `search:${query}`)).get();
    if (cached) {
        return parseXml(cached.response_xml);
    }

    const apiKey = process.env.KRDICT_API_KEY;
    if (!apiKey) {
        console.warn('KRDICT_API_KEY not set');
        return [];
    }

    const url = new URL(`${KRDICT_BASE_URL}/search`);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('q', query);
    url.searchParams.set('translated', 'y');
    url.searchParams.set('trans_lang', '1');
    url.searchParams.set('num', '10');
    url.searchParams.set('part', 'word');

    try {
        const res = await fetch(url.toString());
        const xml = await res.text();

        // Cache the response
        db.insert(krdictCache)
            .values({ query: `search:${query}`, response_xml: xml, cached_at: Math.floor(Date.now() / 1000) })
            .onConflictDoUpdate({ target: krdictCache.query, set: { response_xml: xml, cached_at: Math.floor(Date.now() / 1000) } })
            .run();

        return parseXml(xml);
    } catch (e) {
        console.error('KRDICT fetch error:', e);
        return [];
    }
}

export async function getKrdictWord(targetCode: string): Promise<DictResult | null> {
    const cacheKey = `view:${targetCode}`;
    const cached = db.select().from(krdictCache).where(eq(krdictCache.query, cacheKey)).get();
    if (cached) {
        const results = parseXml(cached.response_xml);
        return results[0] || null;
    }

    const apiKey = process.env.KRDICT_API_KEY;
    if (!apiKey) return null;

    const url = new URL(`${KRDICT_BASE_URL}/view`);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('q', targetCode);
    url.searchParams.set('method', 'target_code');
    url.searchParams.set('translated', 'y');
    url.searchParams.set('trans_lang', '1');

    try {
        const res = await fetch(url.toString());
        const xml = await res.text();

        db.insert(krdictCache)
            .values({ query: cacheKey, response_xml: xml, cached_at: Math.floor(Date.now() / 1000) })
            .onConflictDoUpdate({ target: krdictCache.query, set: { response_xml: xml, cached_at: Math.floor(Date.now() / 1000) } })
            .run();

        const results = parseXml(xml);
        return results[0] || null;
    } catch (e) {
        console.error('KRDICT view error:', e);
        return null;
    }
}
