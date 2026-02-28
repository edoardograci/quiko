import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { listeningEpisodes, listeningProgress } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const episodeId = Number(id);
        if (!Number.isFinite(episodeId)) {
            return NextResponse.json({ error: 'Invalid episode id' }, { status: 400 });
        }

        const episode = db
            .select()
            .from(listeningEpisodes)
            .where(eq(listeningEpisodes.id, episodeId))
            .get();

        if (!episode) {
            return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
        }

        const progress = db
            .select()
            .from(listeningProgress)
            .where(eq(listeningProgress.episode_id, episodeId))
            .get() ?? null;

        return NextResponse.json({ episode, progress });
    } catch (error) {
        console.error('Listening episode error:', error);
        return NextResponse.json({ error: 'Failed to fetch listening episode' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const episodeId = Number(id);
        if (!Number.isFinite(episodeId)) {
            return NextResponse.json({ error: 'Invalid episode id' }, { status: 400 });
        }

        const body = await req.json();
        const youtubeIdRaw: unknown = body.youtube_id;
        if (typeof youtubeIdRaw !== 'string') {
            return NextResponse.json({ error: 'youtube_id must be a string' }, { status: 400 });
        }

        let youtubeId = youtubeIdRaw.trim();
        const urlMatch = youtubeId.match(/[?&]v=([a-zA-Z0-9_-]{11})/) || youtubeId.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
        if (urlMatch) {
            youtubeId = urlMatch[1];
        }

        if (!/^[a-zA-Z0-9_-]{11}$/.test(youtubeId)) {
            return NextResponse.json({ error: 'Invalid YouTube ID or URL' }, { status: 400 });
        }

        const existing = db
            .select()
            .from(listeningEpisodes)
            .where(eq(listeningEpisodes.id, episodeId))
            .get();

        if (!existing) {
            return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
        }

        if (existing.youtube_id === youtubeId) {
            return NextResponse.json({ episode: existing });
        }

        db.transaction((tx) => {
            tx.update(listeningEpisodes)
                .set({ youtube_id: youtubeId })
                .where(eq(listeningEpisodes.id, episodeId))
                .run();

            tx.delete(listeningProgress)
                .where(eq(listeningProgress.episode_id, episodeId))
                .run();
        });

        const updated = db
            .select()
            .from(listeningEpisodes)
            .where(eq(listeningEpisodes.id, episodeId))
            .get();

        return NextResponse.json({ episode: updated });
    } catch (error) {
        console.error('Listening episode update error:', error);
        return NextResponse.json({ error: 'Failed to update episode' }, { status: 500 });
    }
}

