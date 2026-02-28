import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { words, sentences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

import { grammarPatterns } from '@/lib/db/schema';

export async function GET(req: NextRequest, { params }: { params: Promise<{ type: string; id: string }> }) {
    const { type, id } = await params;
    const itemId = parseInt(id);

    if (type !== 'word' && type !== 'sentence' && type !== 'grammar') {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const audioDir = path.join(process.cwd(), 'data', 'audio');
    if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
    }

    const filePath = path.join(audioDir, `${type}-${itemId}.mp3`);

    // Check cache
    if (fs.existsSync(filePath)) {
        const file = fs.readFileSync(filePath);
        return new NextResponse(file, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    }

    try {
        let textToSpeak = '';
        if (type === 'word') {
            const wordList = db.select().from(words).where(eq(words.id, itemId)).all();
            if (wordList.length === 0) return NextResponse.json({ error: 'Word not found' }, { status: 404 });
            textToSpeak = wordList[0].hangul;
        } else if (type === 'grammar') {
            const patternList = db.select().from(grammarPatterns).where(eq(grammarPatterns.id, itemId)).all();
            if (patternList.length === 0 || !patternList[0].example_pattern_use) return NextResponse.json({ error: 'Grammar pattern not found or no example' }, { status: 404 });
            textToSpeak = patternList[0].example_pattern_use;
        } else {
            const sentenceList = db.select().from(sentences).where(eq(sentences.id, itemId)).all();
            if (sentenceList.length === 0) return NextResponse.json({ error: 'Sentence not found' }, { status: 404 });
            textToSpeak = sentenceList[0].korean;
        }

        const tts = new MsEdgeTTS();
        await tts.setMetadata('ko-KR-SunHiNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
        const { audioStream } = tts.toStream(textToSpeak);

        const writeStream = fs.createWriteStream(filePath);
        audioStream.pipe(writeStream);

        await new Promise<void>((resolve, reject) => {
            writeStream.on('finish', () => resolve());
            writeStream.on('error', reject);
        });

        tts.close();

        const file = fs.readFileSync(filePath);
        return new NextResponse(file, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });

    } catch (error) {
        console.error('Audio generation error:', error);
        return NextResponse.json({ error: 'Failed to generate audio' }, { status: 500 });
    }
}
