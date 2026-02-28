import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reviews, reviewLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { processReview, dbReviewToCard } from '@/lib/fsrs';
import { Rating } from 'ts-fsrs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { review_id, rating, user_answer, was_correct, time_spent_ms, session_id, note } = body;

        if (!review_id || rating === undefined) {
            return NextResponse.json({ error: 'review_id and rating are required' }, { status: 400 });
        }

        const reviewRow = db.select().from(reviews).where(eq(reviews.id, review_id)).get();
        if (!reviewRow) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        // Convert DB row to FSRS Card format
        const card = dbReviewToCard(reviewRow);

        // Process rating with FSRS
        const fsrsRating = rating as Rating;
        const { card: newCard } = processReview(card, fsrsRating);

        // Update reviews table
        const now = Math.floor(Date.now() / 1000);
        db.update(reviews)
            .set({
                due: Math.floor(newCard.due.getTime() / 1000),
                stability: newCard.stability,
                difficulty: newCard.difficulty,
                elapsed_days: newCard.elapsed_days,
                scheduled_days: newCard.scheduled_days,
                reps: newCard.reps,
                lapses: newCard.lapses,
                state: newCard.state,
                last_review: now,
            })
            .where(eq(reviews.id, review_id))
            .run();

        // Insert review log
        db.insert(reviewLogs).values({
            review_id,
            rating: fsrsRating,
            user_answer: user_answer ?? null,
            was_correct: was_correct ? 1 : 0,
            time_spent_ms: time_spent_ms ?? null,
            reviewed_at: now,
            session_id: session_id ?? null,
            note: note ?? null,
        }).run();

        return NextResponse.json({
            next_due: newCard.due.toISOString(),
            next_interval_days: newCard.scheduled_days,
            state: newCard.state,
        });
    } catch (error) {
        console.error('Review submit error:', error);
        return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
    }
}
