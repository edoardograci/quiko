import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decks, deckSettings, reviewDeckAssignments, reviews } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const deckId = parseInt(id, 10);
        const deck = db.select().from(decks).where(eq(decks.id, deckId)).get();

        if (!deck) {
            return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
        }

        const settings = db.select().from(deckSettings).where(eq(deckSettings.deck_id, deckId)).get();

        return NextResponse.json({
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
        });
    } catch (error) {
        console.error('Deck fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch deck' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const deckId = parseInt(id, 10);
        const body = await req.json();
        const { name, description, settings } = body;

        const deck = db.select().from(decks).where(eq(decks.id, deckId)).get();
        if (!deck) {
            return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
        }

        db.transaction((tx) => {
            if (name !== undefined || description !== undefined) {
                const updates: Record<string, any> = {};
                if (name !== undefined) updates.name = name;
                if (description !== undefined) updates.description = description;

                tx.update(decks).set(updates).where(eq(decks.id, deckId)).run();
            }

            if (settings) {
                const settingsUpdates: Record<string, any> = {};
                if (settings.daily_review_limit !== undefined) settingsUpdates.daily_review_limit = settings.daily_review_limit;
                if (settings.new_cards_per_day !== undefined) settingsUpdates.new_cards_per_day = settings.new_cards_per_day;
                if (settings.target_retention !== undefined) settingsUpdates.target_retention = settings.target_retention;

                if (Object.keys(settingsUpdates).length > 0) {
                    tx.update(deckSettings).set(settingsUpdates).where(eq(deckSettings.deck_id, deckId)).run();
                }
            }
        });

        const updatedDeck = db.select().from(decks).where(eq(decks.id, deckId)).get();
        const updatedSettings = db.select().from(deckSettings).where(eq(deckSettings.deck_id, deckId)).get();

        return NextResponse.json({
            id: updatedDeck!.id,
            name: updatedDeck!.name,
            source: updatedDeck!.source,
            description: updatedDeck!.description,
            created_at: updatedDeck!.created_at,
            settings: {
                daily_review_limit: updatedSettings?.daily_review_limit ?? 50,
                new_cards_per_day: updatedSettings?.new_cards_per_day ?? 10,
                target_retention: updatedSettings?.target_retention ?? 0.9,
            },
        });
    } catch (error) {
        console.error('Deck update error:', error);
        return NextResponse.json({ error: 'Failed to update deck' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const deckId = parseInt(id, 10);
        const deck = db.select().from(decks).where(eq(decks.id, deckId)).get();

        if (!deck) {
            return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
        }

        db.transaction((tx) => {
            tx.delete(reviewDeckAssignments).where(eq(reviewDeckAssignments.deck_id, deckId)).run();
            tx.delete(deckSettings).where(eq(deckSettings.deck_id, deckId)).run();
            tx.delete(decks).where(eq(decks.id, deckId)).run();
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Deck delete error:', error);
        return NextResponse.json({ error: 'Failed to delete deck' }, { status: 500 });
    }
}
