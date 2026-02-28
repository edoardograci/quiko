import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { books } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const bookId = parseInt(id);

        const book = db.select().from(books).where(eq(books.id, bookId)).get();
        if (!book) return new NextResponse('Book not found', { status: 404 });

        const booksDir = path.join(process.cwd(), 'data', 'books');
        const filePath = path.join(booksDir, `${bookId}-${book.filename}`);
        if (!fs.existsSync(filePath)) {
            return new NextResponse('PDF file not found', { status: 404 });
        }

        const buffer = fs.readFileSync(filePath);

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Length': buffer.length.toString(),
            },
        });

    } catch (error) {
        console.error('PDF file serve error:', error);
        return new NextResponse('Failed to serve PDF file', { status: 500 });
    }
}
