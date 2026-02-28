import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { readingProgress } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const bookId = parseInt(id);
        const { page } = await req.json();

        if (typeof page !== 'number') {
            return NextResponse.json({ error: 'Invalid page number' }, { status: 400 });
        }

        // Upsert reading progress
        db.insert(readingProgress)
            .values({
                book_id: bookId,
                current_page: page,
                last_read: Math.floor(Date.now() / 1000)
            })
            .onConflictDoUpdate({
                target: readingProgress.book_id,
                set: {
                    current_page: page,
                    last_read: Math.floor(Date.now() / 1000)
                }
            })
            .run();

        return NextResponse.json({ success: true, page });
    } catch (error) {
        console.error('Progress update error:', error);
        return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
    }
}
