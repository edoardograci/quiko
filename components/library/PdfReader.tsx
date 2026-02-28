'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, BookOpen } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfReaderProps {
    fileUrl: string;
    pageNum: number;
    scale: number;
}

export default function PdfReader({ fileUrl, pageNum, scale }: PdfReaderProps) {
    return (
        <Document
            file={fileUrl}
            loading={
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                </div>
            }
            error={
                <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                    <BookOpen className="w-12 h-12 mb-4 opacity-20" />
                    <p>Failed to load PDF document.</p>
                </div>
            }
        >
            <Page
                pageNumber={pageNum}
                scale={scale}
                loading={
                    <div className="flex items-center justify-center w-[600px] h-[800px] bg-card animate-pulse shadow-sm">
                        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                    </div>
                }
                className="shadow-md bg-white text-black"
                renderTextLayer={true}
                renderAnnotationLayer={true}
            />
        </Document>
    );
}
