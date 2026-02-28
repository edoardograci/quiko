import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { words, wordDefinitions, wordExamples, reviews, sentenceWords, sentences } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

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
                .where(inArray(sentences.id, sw.map(r => r.sentence_id)))
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
        const { hangul, hanja, pronunciation, pos, level, frequency_rank, stem, irregular_type, notes, tags, definitions, examples } = body;

        db.update(words).set({
            hangul, hanja, pronunciation, pos, level, frequency_rank, stem, irregular_type, notes,
            tags: tags ? JSON.stringify(tags) : null,
            updated_at: Math.floor(Date.now() / 1000),
        }).where(eq(words.id, wordId)).run();

        // Update definitions
        if (definitions) {
            db.delete(wordDefinitions).where(eq(wordDefinitions.word_id, wordId)).run();
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

        // Update examples
        if (examples) {
            db.delete(wordExamples).where(eq(wordExamples.word_id, wordId)).run();
            for (const ex of examples) {
                db.insert(wordExamples).values({
                    word_id: wordId,
                    example_ko: ex.example_ko,
                    example_en: ex.example_en,
                    source: ex.source || 'custom',
                }).run();
            }
        }

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
