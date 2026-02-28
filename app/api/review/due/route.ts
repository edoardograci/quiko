import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reviews, words, grammarPatterns, wordDefinitions, wordExamples, sentences } from '@/lib/db/schema';
import { lte, eq, and, asc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const countOnly = searchParams.get('count_only') === 'true';
    const mode = searchParams.get('mode'); // 'word' | 'grammar' | null (all)

    const now = Math.floor(Date.now() / 1000);

    try {
        // Get settings
        const limitSetting = await db.query.settings.findFirst({ where: (s, { eq }) => eq(s.key, 'daily_review_limit') });
        const newCardsSetting = await db.query.settings.findFirst({ where: (s, { eq }) => eq(s.key, 'new_cards_per_day') });
        const dailyLimit = parseInt(limitSetting?.value ?? '50');
        const newCardsLimit = parseInt(newCardsSetting?.value ?? '10');

        // Build query
        let dueQuery = db.select().from(reviews).where(lte(reviews.due, now));

        if (mode === 'word') {
            dueQuery = db.select().from(reviews).where(and(lte(reviews.due, now), eq(reviews.item_type, 'word')));
        } else if (mode === 'grammar') {
            dueQuery = db.select().from(reviews).where(and(lte(reviews.due, now), eq(reviews.item_type, 'grammar_pattern')));
        }

        const dueReviews = dueQuery.orderBy(asc(reviews.due)).limit(dailyLimit).all();

        if (countOnly) {
            return NextResponse.json({ total: dueReviews.length });
        }

        const newReviews = db.select().from(reviews)
            .where(eq(reviews.state, 0))
            .limit(newCardsLimit)
            .all();

        // Combine due + new (deduplicated)
        const existingIds = new Set(dueReviews.map(r => r.id));
        const combined = [...dueReviews, ...newReviews.filter(r => !existingIds.has(r.id))].slice(0, dailyLimit);

        // Enrich cards with item data
        const cards = [];
        for (const review of combined) {
            if (review.item_type === 'word') {
                const word = await db.select().from(words).where(eq(words.id, review.item_id)).get();
                if (!word) continue;
                const definitions = await db.select().from(wordDefinitions).where(eq(wordDefinitions.word_id, word.id)).all();
                const examples = await db.select().from(wordExamples).where(eq(wordExamples.word_id, word.id)).limit(2).all();
                cards.push({
                    review_id: review.id,
                    item_type: 'word',
                    item_id: review.item_id,
                    review_mode: review.review_mode,
                    word,
                    definitions,
                    examples,
                    fsrs: {
                        state: review.state,
                        due: review.due,
                        stability: review.stability,
                        difficulty: review.difficulty,
                        reps: review.reps,
                        lapses: review.lapses,
                    },
                });
            } else if (review.item_type === 'grammar_pattern') {
                const pattern = await db.select().from(grammarPatterns).where(eq(grammarPatterns.id, review.item_id)).get();
                if (!pattern) continue;
                cards.push({
                    review_id: review.id,
                    item_type: 'grammar_pattern',
                    item_id: review.item_id,
                    review_mode: review.review_mode,
                    pattern,
                    fsrs: {
                        state: review.state,
                        due: review.due,
                        stability: review.stability,
                        difficulty: review.difficulty,
                        reps: review.reps,
                        lapses: review.lapses,
                    },
                });
            }
        }

        const totalNew = combined.filter(r => r.state === 0).length;
        const totalReview = combined.filter(r => r.state !== 0).length;

        return NextResponse.json({
            total: combined.length,
            new: totalNew,
            review: totalReview,
            cards,
        });
    } catch (error) {
        console.error('Review due error:', error);
        return NextResponse.json({ error: 'Failed to fetch due reviews' }, { status: 500 });
    }
}
