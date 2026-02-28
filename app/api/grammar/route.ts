import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { grammarPatterns, sentenceGrammarPatterns, reviews } from '@/lib/db/schema';
import { desc, eq, sql, like, and } from 'drizzle-orm';
import { createReviewCard } from '@/lib/fsrs';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const level = searchParams.get('level');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const offset = (page - 1) * limit;

    try {
        const conditions = [];
        if (query) conditions.push(like(grammarPatterns.pattern, `%${query}%`));
        if (level) conditions.push(eq(grammarPatterns.level, level));
        if (category) conditions.push(eq(grammarPatterns.category, category));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const result = whereClause
            ? db.select().from(grammarPatterns).where(whereClause).orderBy(desc(grammarPatterns.id)).limit(limit).offset(offset).all()
            : db.select().from(grammarPatterns).orderBy(desc(grammarPatterns.id)).limit(limit).offset(offset).all();

        const total = (whereClause
            ? db.select({ count: sql<number>`count(*)` }).from(grammarPatterns).where(whereClause).get()
            : db.select({ count: sql<number>`count(*)` }).from(grammarPatterns).get())?.count ?? 0;

        // Add sentence counts
        const enriched = result.map(p => {
            const sentenceCount = db.select({ count: sql<number>`count(*)` })
                .from(sentenceGrammarPatterns)
                .where(eq(sentenceGrammarPatterns.grammar_pattern_id, p.id))
                .get()?.count ?? 0;
            return { ...p, sentence_count: sentenceCount };
        });

        return NextResponse.json({ patterns: enriched, total, page, limit });
    } catch (error) {
        console.error('Grammar GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch grammar patterns' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { pattern, name_ko, name_en, description, level, category, formality, example_pattern_use, notes } = body;

        if (!pattern || !name_en || !description) {
            return NextResponse.json({ error: 'pattern, name_en, description are required' }, { status: 400 });
        }

        const result = db.insert(grammarPatterns).values({
            pattern, name_ko, name_en, description, level, category, formality, example_pattern_use, notes,
        }).returning().get();

        // Create review cards for grammar pattern
        db.insert(reviews).values(createReviewCard('grammar_pattern', result.id, 'recognition')).onConflictDoNothing().run();

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Grammar POST error:', error);
        return NextResponse.json({ error: 'Failed to create grammar pattern' }, { status: 500 });
    }
}
