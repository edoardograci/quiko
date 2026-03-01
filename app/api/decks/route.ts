import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decks, deckSettings, reviewDeckAssignments, reviews } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';

export async function GET() {
    try {
        const allDecks = db.select().from(decks).orderBy(decks.created_at).all();

        const result = allDecks.map((deck) => {
            const settings = db.select().from(deckSettings).where(eq(deckSettings.deck_id, deck.id)).get();
            
            // Count total cards in deck
            const assignedReviews = db.select({ review_id: reviewDeckAssignments.review_id })
                .from(reviewDeckAssignments)
                .where(eq(reviewDeckAssignments.deck_id, deck.id))
                .all();
            
            const assignedReviewIds = assignedReviews.map(r => r.review_id);
            let total_cards = 0;
            let due_count = 0;
            
            if (assignedReviewIds.length > 0) {
                const now = Math.floor(Date.now() / 1000);
                const deckReviews = db.select().from(reviews).all();
                
                const deckReviewsFiltered = deckReviews.filter(r => assignedReviewIds.includes(r.id));
                total_cards = deckReviewsFiltered.length;
                due_count = deckReviewsFiltered.filter(r => r.due <= now).length;
            }

            return {
                id: deck.id,
                name: deck.name,
                source: deck.source,
                description: deck.description,
                created_at: deck.created_at,
                settings: {
                    daily_review_limit: settings?.daily_review_limit ?? 50,
                    new_cards_per_day: settings?.new_cards_per_day ?? 10,
                    target_retention: settings?.target_retention ?? 0.9,
                },
                total_cards,
                due_count,
            };
        });

        return NextResponse.json({ decks: result });
    } catch (error) {
        console.error('Decks fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch decks' }, { status: 500 });
    }
}
