import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { listeningEpisodes, listeningProgress } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
    try {
        const episodes = db
            .select()
            .from(listeningEpisodes)
            .orderBy(desc(listeningEpisodes.episode_number))
            .all();

        const progressRows = db
            .select()
            .from(listeningProgress)
            .all();

        const progressMap = new Map<number, (typeof progressRows)[number]>();
        for (const p of progressRows) {
            progressMap.set(p.episode_id, p);
        }

        const items = episodes.map((e) => ({
            ...e,
            progress: progressMap.get(e.id) ?? null,
        }));

        return NextResponse.json({ episodes: items });
    } catch (error) {
        console.error('Listening list error:', error);
        return NextResponse.json({ error: 'Failed to fetch listening episodes' }, { status: 500 });
    }
}

