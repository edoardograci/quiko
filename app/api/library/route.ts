import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { books, readingProgress } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export function GET() {
    try {
        const result = db.select({
            id: books.id,
            title: books.title,
            filename: books.filename,
            total_pages: books.total_pages,
            added_at: books.added_at,
            current_page: readingProgress.current_page,
            last_read: readingProgress.last_read
        })
            .from(books)
            .leftJoin(readingProgress, eq(books.id, readingProgress.book_id))
            .all();

        return NextResponse.json(result);
    } catch (error) {
        console.error('List library error:', error);
        return NextResponse.json({ error: 'Failed to fetch library' }, { status: 500 });
    }
}
