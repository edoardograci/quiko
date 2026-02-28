import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { books } from '@/lib/db/schema';
import path from 'path';
import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        if (file.type !== 'application/pdf') return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });

        const buffer = Buffer.from(await file.arrayBuffer());

        // Parse PDF to get page count using pdf-lib
        let totalPages = 0;
        try {
            const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
            totalPages = pdfDoc.getPageCount();
        } catch (e) {
            console.error('Failed to parse PDF page count:', e);
            totalPages = 1;
        }

        const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

        // Create DB record first to get ID
        const result = db.insert(books).values({
            title: file.name.replace(/\.pdf$/i, ''),
            filename: sanitizedFilename,
            total_pages: totalPages,
        }).returning({
            id: books.id,
            title: books.title,
            total_pages: books.total_pages
        }).get() as { id: number; title: string; total_pages: number | null };

        const bookId = result.id;

        const booksDir = path.join(process.cwd(), 'data', 'books');
        if (!fs.existsSync(booksDir)) {
            fs.mkdirSync(booksDir, { recursive: true });
        }

        // Save file physically
        const filePath = path.join(booksDir, `${bookId}-${sanitizedFilename}`);
        fs.writeFileSync(filePath, buffer);

        return NextResponse.json(result);

    } catch (error) {
        console.error('PDF upload error:', error);
        return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 });
    }
}
