import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { grammarPatterns, sentenceGrammarPatterns, sentences, reviews } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const patternId = parseInt(id);

    try {
        const pattern = db.select().from(grammarPatterns).where(eq(grammarPatterns.id, patternId)).get();
        if (!pattern) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Linked sentences
        const linkedSentences = db.select({ s: sentences })
            .from(sentenceGrammarPatterns)
            .innerJoin(sentences, eq(sentences.id, sentenceGrammarPatterns.sentence_id))
            .where(eq(sentenceGrammarPatterns.grammar_pattern_id, patternId))
            .all()
            .map(r => r.s);

        // Review card
        const reviewCard = db.select().from(reviews)
            .where(eq(reviews.item_id, patternId))
            .all()
            .find(r => r.item_type === 'grammar_pattern');

        return NextResponse.json({ pattern, linkedSentences, review: reviewCard });
    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const body = await req.json();
        db.update(grammarPatterns).set(body).where(eq(grammarPatterns.id, parseInt(id))).run();
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        db.delete(grammarPatterns).where(eq(grammarPatterns.id, parseInt(id))).run();
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
