import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { words, wordDefinitions } from '@/lib/db/schema';
import { like, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    if (!q) return NextResponse.json({ results: [] });

    try {
        const exactMatch = db.select().from(words).where(like(words.hangul, `%${q}%`)).limit(3).all();
        const results = exactMatch.map(w => {
            const definitions = db.select().from(wordDefinitions).where(eq(wordDefinitions.word_id, w.id)).all();
            return {
                ...w,
                definitions
            };
        });
        return NextResponse.json({ results });
    } catch (error) {
        console.error('Local lookup error:', error);
        return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
    }
}
