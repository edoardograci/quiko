import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { books, readingProgress } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const bookId = parseInt(id);
        const book = db.select({
            id: books.id,
            title: books.title,
            filename: books.filename,
            total_pages: books.total_pages,
            current_page: readingProgress.current_page,
            last_read: readingProgress.last_read
        })
            .from(books)
            .leftJoin(readingProgress, eq(books.id, readingProgress.book_id))
            .where(eq(books.id, bookId))
            .get();

        if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        return NextResponse.json(book);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to find book' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const bookId = parseInt(id);
        const book = db.select().from(books).where(eq(books.id, bookId)).get();
        if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });

        // Delete from DB (cascade deletes reading progress)
        db.delete(books).where(eq(books.id, bookId)).run();

        // Delete file
        const booksDir = path.join(process.cwd(), 'data', 'books');
        const filePath = path.join(booksDir, `${bookId}-${book.filename}`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
    }
}
