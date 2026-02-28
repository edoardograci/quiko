import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { words, wordDefinitions, wordExamples, reviews, sentenceWords, sentences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const wordId = parseInt(id);

    try {
        const word = db.select().from(words).where(eq(words.id, wordId)).get();
        if (!word) return NextResponse.json({ error: 'Word not found' }, { status: 404 });

        const definitions = db.select().from(wordDefinitions).where(eq(wordDefinitions.word_id, wordId)).all();
        const examples = db.select().from(wordExamples).where(eq(wordExamples.word_id, wordId)).all();
        const reviewCards = db.select().from(reviews)
            .where(eq(reviews.item_id, wordId))
            .all()
            .filter(r => r.item_type === 'word');

        // Get sentences containing this word
        const sw = db.select().from(sentenceWords).where(eq(sentenceWords.word_id, wordId)).all();
        const linkedSentences = sw.length > 0
            ? db.select().from(sentences)
                .where(eq(sentences.id, sw[0].sentence_id))
                .limit(5)
                .all()
            : [];

        return NextResponse.json({ word, definitions, examples, reviews: reviewCards, linkedSentences });
    } catch (error) {
        console.error('Word GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch word' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const wordId = parseInt(id);

    try {
        const body = await req.json();
        const { hangul, hanja, pronunciation, pos, level, frequency_rank, stem, irregular_type, notes, tags } = body;

        db.update(words).set({
            hangul, hanja, pronunciation, pos, level, frequency_rank, stem, irregular_type, notes,
            tags: tags ? JSON.stringify(tags) : null,
            updated_at: Math.floor(Date.now() / 1000),
        }).where(eq(words.id, wordId)).run();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Word PUT error:', error);
        return NextResponse.json({ error: 'Failed to update word' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const wordId = parseInt(id);

    try {
        db.delete(words).where(eq(words.id, wordId)).run();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Word DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete word' }, { status: 500 });
    }
}
