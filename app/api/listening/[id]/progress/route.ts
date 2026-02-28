import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { listeningEpisodes, listeningProgress } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
    req: NextRequest,
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

        const body = await req.json();
        const positionSecondsRaw: unknown = body.position_seconds;
        const completedRaw: unknown = body.completed;

        const positionSeconds =
            typeof positionSecondsRaw === 'number' && positionSecondsRaw >= 0
                ? Math.floor(positionSecondsRaw)
                : 0;
        const completed = completedRaw === true;

        const now = Math.floor(Date.now() / 1000);

        db.insert(listeningProgress)
            .values({
                episode_id: episodeId,
                last_position_seconds: completed ? 0 : positionSeconds,
                completed: completed ? 1 : 0,
                last_watched: now,
            })
            .onConflictDoUpdate({
                target: listeningProgress.episode_id,
                set: {
                    last_position_seconds: completed ? 0 : positionSeconds,
                    completed: completed ? 1 : 0,
                    last_watched: now,
                },
            })
            .run();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Listening progress error:', error);
        return NextResponse.json({ error: 'Failed to update listening progress' }, { status: 500 });
    }
}

