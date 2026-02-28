import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sentences, sentenceWords, sentenceGrammarPatterns, grammarPatterns, words } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sentenceId = parseInt(id);

    try {
        const sentence = db.select().from(sentences).where(eq(sentences.id, sentenceId)).get();
        if (!sentence) return NextResponse.json({ error: 'Sentence not found' }, { status: 404 });

        // Get tokens with word info
        const tokens = db.select({
            sw: sentenceWords,
            word: words,
        })
            .from(sentenceWords)
            .leftJoin(words, eq(words.id, sentenceWords.word_id))
            .where(eq(sentenceWords.sentence_id, sentenceId))
            .all();

        // Get grammar patterns
        const patterns = db.select({ gp: grammarPatterns })
            .from(sentenceGrammarPatterns)
            .innerJoin(grammarPatterns, eq(grammarPatterns.id, sentenceGrammarPatterns.grammar_pattern_id))
            .where(eq(sentenceGrammarPatterns.sentence_id, sentenceId))
            .all()
            .map(r => r.gp);

        return NextResponse.json({ sentence, tokens, grammarPatterns: patterns });
    } catch (error) {
        console.error('Sentence GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch sentence' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sentenceId = parseInt(id);

    try {
        const body = await req.json();
        const { korean, literal_translation, natural_translation, source, level, notes } = body;

        db.update(sentences).set({
            korean, literal_translation, natural_translation, source, level, notes,
            updated_at: Math.floor(Date.now() / 1000),
        }).where(eq(sentences.id, sentenceId)).run();

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update sentence' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sentenceId = parseInt(id);

    try {
        db.delete(sentences).where(eq(sentences.id, sentenceId)).run();
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete sentence' }, { status: 500 });
    }
}
