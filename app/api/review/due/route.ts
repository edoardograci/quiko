import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reviews, words, grammarPatterns, wordDefinitions, wordExamples, sentences, reviewDeckAssignments } from '@/lib/db/schema';
import { lte, eq, and, asc, inArray } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const countOnly = searchParams.get('count_only') === 'true';
    const mode = searchParams.get('mode'); // 'word' | 'grammar' | null (all)
    const deckId = searchParams.get('deck_id') ? parseInt(searchParams.get('deck_id')!, 10) : null;

    const now = Math.floor(Date.now() / 1000);

    try {
        // Get settings - use deck settings if deck_id provided, otherwise global settings
        let dailyLimit = 50;
        let newCardsLimit = 10;

        if (deckId) {
            const deckSettings = await db.query.deckSettings?.findFirst?.({ where: (ds, { eq }) => eq(ds.deck_id, deckId) });
            if (deckSettings) {
                dailyLimit = deckSettings.daily_review_limit;
                newCardsLimit = deckSettings.new_cards_per_day;
            }
        } else {
            const limitSetting = await db.query.settings.findFirst({ where: (s, { eq }) => eq(s.key, 'daily_review_limit') });
            const newCardsSetting = await db.query.settings.findFirst({ where: (s, { eq }) => eq(s.key, 'new_cards_per_day') });
            dailyLimit = parseInt(limitSetting?.value ?? '50');
            newCardsLimit = parseInt(newCardsSetting?.value ?? '10');
        }

        // Get all reviews first, then filter by deck if needed
        let allReviews = db.select().from(reviews).all();

        // If deck_id is provided, filter to only reviews assigned to that deck
        if (deckId) {
            const deckAssignedReviewIds = db.select({ review_id: reviewDeckAssignments.review_id })
                .from(reviewDeckAssignments)
                .where(eq(reviewDeckAssignments.deck_id, deckId))
                .all()
                .map(r => r.review_id);
            allReviews = allReviews.filter(r => deckAssignedReviewIds.includes(r.id));
        }

        // Filter due reviews
        let dueReviews = allReviews.filter(r => r.due <= now).sort((a, b) => a.due - b.due).slice(0, dailyLimit);

        if (mode === 'word') {
            dueReviews = dueReviews.filter(r => r.item_type === 'word');
        } else if (mode === 'grammar') {
            dueReviews = dueReviews.filter(r => r.item_type === 'grammar_pattern');
        }

        if (countOnly) {
            return NextResponse.json({ total: dueReviews.length });
        }

        // Filter new reviews
        let newReviews = allReviews.filter(r => r.state === 0);

        if (mode === 'word') {
            newReviews = newReviews.filter(r => r.item_type === 'word');
        } else if (mode === 'grammar') {
            newReviews = newReviews.filter(r => r.item_type === 'grammar_pattern');
        }

        newReviews = newReviews.slice(0, newCardsLimit);

        // Combine due + new (deduplicated)
        const existingIds = new Set(dueReviews.map(r => r.id));
        const combined = [...dueReviews, ...newReviews.filter(r => !existingIds.has(r.id))].slice(0, dailyLimit);

        // Enrich cards with item data
        const cards = [];
        const wordIds = Array.from(new Set(combined.filter(r => r.item_type === 'word').map(r => r.item_id)));
        const grammarIds = Array.from(new Set(combined.filter(r => r.item_type === 'grammar_pattern').map(r => r.item_id)));

        const wordMap = new Map();
        const defMap = new Map();
        const exMap = new Map();
        const patternMap = new Map();

        if (wordIds.length > 0) {
            const fetchedWords = await db.select().from(words).where(inArray(words.id, wordIds)).all();
            fetchedWords.forEach(w => wordMap.set(w.id, w));

            const fetchedDefs = await db.select().from(wordDefinitions).where(inArray(wordDefinitions.word_id, wordIds)).all();
            fetchedDefs.forEach(d => {
                const arr = defMap.get(d.word_id) || [];
                arr.push(d);
                defMap.set(d.word_id, arr);
            });

            const fetchedExs = await db.select().from(wordExamples).where(inArray(wordExamples.word_id, wordIds)).all();
            fetchedExs.forEach(e => {
                const arr = exMap.get(e.word_id) || [];
                // limit to 2 manually or just add all and slice per word
                if (arr.length < 2) arr.push(e);
                exMap.set(e.word_id, arr);
            });
        }

        if (grammarIds.length > 0) {
            const fetchedPatterns = await db.select().from(grammarPatterns).where(inArray(grammarPatterns.id, grammarIds)).all();
            fetchedPatterns.forEach(p => patternMap.set(p.id, p));
        }

        for (const review of combined) {
            if (review.item_type === 'word') {
                const word = wordMap.get(review.item_id);
                if (!word) continue;
                cards.push({
                    review_id: review.id,
                    item_type: 'word',
                    item_id: review.item_id,
                    review_mode: review.review_mode,
                    word,
                    definitions: defMap.get(review.item_id) || [],
                    examples: exMap.get(review.item_id) || [],
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
                const pattern = patternMap.get(review.item_id);
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
