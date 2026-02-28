import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sentences, sentenceWords, sentenceGrammarPatterns, grammarPatterns, words } from '@/lib/db/schema';
import { desc, eq, sql, like, and, inArray } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const level = searchParams.get('level');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    try {
        const conditions = [];
        if (query) conditions.push(like(sentences.korean, `%${query}%`));
        if (level) conditions.push(eq(sentences.level, level));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const result = whereClause
            ? db.select().from(sentences).where(whereClause).orderBy(desc(sentences.created_at)).limit(limit).offset(offset).all()
            : db.select().from(sentences).orderBy(desc(sentences.created_at)).limit(limit).offset(offset).all();

        const total = (whereClause
            ? db.select({ count: sql<number>`count(*)` }).from(sentences).where(whereClause).get()
            : db.select({ count: sql<number>`count(*)` }).from(sentences).get())?.count ?? 0;

        // Enrich with grammar patterns using a single batch query
        const sentenceIds = result.map((s) => s.id);
        const patternsBySentenceId = new Map<number, { id: number; pattern: string | null; name_en: string }[]>();

        if (sentenceIds.length > 0) {
            const rows = db
                .select({
                    sentence_id: sentenceGrammarPatterns.sentence_id,
                    id: grammarPatterns.id,
                    pattern: grammarPatterns.pattern,
                    name_en: grammarPatterns.name_en,
                })
                .from(sentenceGrammarPatterns)
                .innerJoin(grammarPatterns, eq(grammarPatterns.id, sentenceGrammarPatterns.grammar_pattern_id))
                .where(inArray(sentenceGrammarPatterns.sentence_id, sentenceIds))
                .all();

            for (const row of rows) {
                const arr = patternsBySentenceId.get(row.sentence_id) ?? [];
                arr.push({ id: row.id, pattern: row.pattern, name_en: row.name_en });
                patternsBySentenceId.set(row.sentence_id, arr);
            }
        }

        const enriched = result.map((s) => ({
            ...s,
            grammarPatterns: patternsBySentenceId.get(s.id) ?? [],
        }));

        return NextResponse.json({ sentences: enriched, total, page, limit });
    } catch (error) {
        console.error('Sentences GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch sentences' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { korean, literal_translation, natural_translation, source, level, notes, tokens, grammar_pattern_ids } = body;

        if (!korean || !natural_translation) {
            return NextResponse.json({ error: 'korean and natural_translation are required' }, { status: 400 });
        }

        const result = db.insert(sentences).values({
            korean,
            literal_translation,
            natural_translation,
            source,
            level,
            notes,
        }).returning().get();

        const sentenceId = result.id;

        // Insert tokens (sentence_words)
        if (tokens?.length) {
            for (const token of tokens) {
                db.insert(sentenceWords).values({
                    sentence_id: sentenceId,
                    word_id: token.word_id,
                    position: token.position,
                    surface_form: token.surface_form,
                    morpheme_breakdown: token.morpheme_breakdown ? JSON.stringify(token.morpheme_breakdown) : null,
                    grammatical_role: token.grammatical_role,
                    particle_attached: token.particle_attached,
                }).run();
            }
        }

        // Link grammar patterns
        if (grammar_pattern_ids?.length) {
            for (const gpId of grammar_pattern_ids) {
                db.insert(sentenceGrammarPatterns).values({
                    sentence_id: sentenceId,
                    grammar_pattern_id: gpId,
                }).onConflictDoNothing().run();
            }
        }

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Sentences POST error:', error);
        return NextResponse.json({ error: 'Failed to create sentence' }, { status: 500 });
    }
}
