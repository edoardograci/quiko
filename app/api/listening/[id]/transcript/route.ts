import { NextRequest, NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import { db } from '@/lib/db';
import { listeningEpisodes, listeningTranscripts } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';

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

        if (!episode || !episode.youtube_id) {
            return NextResponse.json({ error: 'No YouTube ID set' }, { status: 400 });
        }

        const cached = db
            .select()
            .from(listeningTranscripts)
            .where(eq(listeningTranscripts.episode_id, episodeId))
            .orderBy(asc(listeningTranscripts.start_ms))
            .all();

        if (cached.length > 0) {
            return NextResponse.json({ segments: cached, cached: true });
        }

        let segments: { text: string; duration: number; offset: number }[] = [];
        try {
            segments = await YoutubeTranscript.fetchTranscript(episode.youtube_id, { lang: 'ko' });
            if (!segments || segments.length === 0) {
                segments = await YoutubeTranscript.fetchTranscript(episode.youtube_id);
            }
        } catch (innerError) {
            console.error('YouTube transcript fetch error:', innerError);
            return NextResponse.json(
                { error: 'Could not fetch transcript' },
                { status: 500 },
            );
        }

        if (!segments || segments.length === 0) {
            return NextResponse.json(
                { segments: [], cached: false, message: 'No transcript available' },
                { status: 200 },
            );
        }

        db.transaction((tx) => {
            for (const seg of segments) {
                const startMs = Math.round(seg.offset);
                const endMs = Math.round(seg.offset + seg.duration);
                const text = seg.text.trim();
                if (!text) continue;

                tx.insert(listeningTranscripts)
                    .values({
                        episode_id: episodeId,
                        start_ms: startMs,
                        end_ms: endMs,
                        text,
                    })
                    .onConflictDoNothing()
                    .run();
            }
        });

        const stored = db
            .select()
            .from(listeningTranscripts)
            .where(eq(listeningTranscripts.episode_id, episodeId))
            .orderBy(asc(listeningTranscripts.start_ms))
            .all();

        return NextResponse.json({ segments: stored, cached: false });
    } catch (error) {
        console.error('Listening transcript error:', error);
        return NextResponse.json(
            { error: 'Could not fetch transcript', detail: String(error) },
            { status: 500 },
        );
    }
}

