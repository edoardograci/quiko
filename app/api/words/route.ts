import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { words, wordDefinitions, wordExamples, reviews } from '@/lib/db/schema';
import { like, eq, desc, asc, and, sql } from 'drizzle-orm';
import { createReviewCard } from '@/lib/fsrs';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const pos = searchParams.get('pos');
    const level = searchParams.get('level');
    const sortBy = searchParams.get('sort') || 'created_at';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    try {
        const conditions = [];
        if (query) {
            conditions.push(like(words.hangul, `%${query}%`));
        }
        if (pos) conditions.push(eq(words.pos, pos));
        if (level) conditions.push(eq(words.level, level));

        const orderBy = sortBy === 'frequency_rank' ? asc(words.frequency_rank)
            : sortBy === 'hangul' ? asc(words.hangul)
                : desc(words.created_at);

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const result = whereClause
            ? db.select().from(words).where(whereClause).orderBy(orderBy).limit(limit).offset(offset).all()
            : db.select().from(words).orderBy(orderBy).limit(limit).offset(offset).all();

        const total = (whereClause
            ? db.select({ count: sql<number>`count(*)` }).from(words).where(whereClause).get()
            : db.select({ count: sql<number>`count(*)` }).from(words).get())?.count ?? 0;

        return NextResponse.json({ words: result, total, page, limit });
    } catch (error) {
        console.error('Words GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch words' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { hangul, hanja, pronunciation, pos, level, frequency_rank, stem, irregular_type, notes, tags, definitions, examples } = body;

        if (!hangul) {
            return NextResponse.json({ error: 'hangul is required' }, { status: 400 });
        }

        const result = db.insert(words).values({
            hangul,
            hanja,
            pronunciation,
            pos,
            level,
            frequency_rank,
            stem,
            irregular_type,
            notes,
            tags: tags ? JSON.stringify(tags) : null,
        }).returning().get();

        const wordId = result.id;

        // Insert definitions
        if (definitions?.length) {
            for (const def of definitions) {
                db.insert(wordDefinitions).values({
                    word_id: wordId,
                    definition_ko: def.definition_ko,
                    definition_en: def.definition_en,
                    order_num: def.order_num || 1,
                    krdict_target_code: def.krdict_target_code,
                }).run();
            }
        }

        // Insert examples
        if (examples?.length) {
            for (const ex of examples) {
                db.insert(wordExamples).values({
                    word_id: wordId,
                    example_ko: ex.example_ko,
                    example_en: ex.example_en,
                    source: ex.source || 'custom',
                }).run();
            }
        }

        // Create review cards automatically
        db.insert(reviews).values(createReviewCard('word', wordId, 'recognition')).onConflictDoNothing().run();
        db.insert(reviews).values(createReviewCard('word', wordId, 'production')).onConflictDoNothing().run();

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Words POST error:', error);
        return NextResponse.json({ error: 'Failed to create word' }, { status: 500 });
    }
}
