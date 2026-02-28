'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, Upload, FileSignature, Trash2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Book {
    id: number;
    title: string;
    filename: string;
    total_pages: number | null;
    added_at: number;
    current_page: number | null;
    last_read: number | null;
}

export default function LibraryPage() {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const fetchBooks = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/library');
            const data = await res.json();
            setBooks(data);
        } catch (error) {
            console.error('Failed to fetch books', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooks();
    }, []);

    const handleUpload = async (file: File) => {
        if (!file || file.type !== 'application/pdf') {
            toast.error('Please upload a valid PDF file.');
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            toast.error('File size must be under 50MB.');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/library/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            toast.success('Book uploaded successfully!');
            setShowUploadModal(false);
            fetchBooks();
        } catch (error: any) {
            toast.error(error.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this book?')) return;

        try {
            await fetch(`/api/library/${id}`, { method: 'DELETE' });
            toast.success('Book deleted');
            fetchBooks();
        } catch {
            toast.error('Failed to delete book');
        }
    };

    return (
        <div className="flex flex-col h-full max-w-6xl mx-auto p-6 md:p-8 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-semibold">Library</h1>
                    <p className="text-muted-foreground text-sm">Read and extract vocabulary from Korean PDFs.</p>
                </div>
                <Button onClick={() => setShowUploadModal(true)} className="gap-2 shrink-0">
                    <Upload className="w-4 h-4" />
                    Upload PDF
                </Button>
            </div>

            {/* List */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-48 rounded-xl" />
                    ))}
                </div>
            ) : books.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-2xl relative bg-muted/20">
                    <FileSignature className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <h2 className="text-xl font-medium mb-2">Your library is empty</h2>
                    <p className="text-muted-foreground mb-6 max-w-md">Upload Korean PDF books, short stories, or textbooks to read and mine vocabulary directly from the text.</p>
                    <Button onClick={() => setShowUploadModal(true)}>Upload your first book</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {books.map(book => {
                        const total = book.total_pages || 1;
                        const current = book.current_page || 1;
                        const progressPct = Math.round((current / total) * 100);

                        return (
                            <Card key={book.id} className="p-6 flex flex-col gap-4 relative group transition-colors hover:border-primary/50">
                                <div className="flex gap-4">
                                    <div className="w-16 h-20 bg-muted rounded-md border border-border shadow-sm flex items-center justify-center shrink-0">
                                        <BookOpen className="w-6 h-6 text-muted-foreground/50" />
                                    </div>
                                    <div className="min-w-0 flex-1 flex flex-col justify-between py-1">
                                        <h3 className="font-medium line-clamp-2 leading-tight" title={book.title}>
                                            {book.title}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <CalendarDays className="w-3.5 h-3.5" />
                                            {book.last_read
                                                ? new Date(book.last_read * 1000).toLocaleDateString()
                                                : new Date(book.added_at * 1000).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5 mt-auto">
                                    <div className="flex justify-between text-xs font-mono">
                                        <span className="text-muted-foreground">{current} / {total}</span>
                                        <span className="font-medium">{progressPct}%</span>
                                    </div>
                                    <Progress value={progressPct} className="h-2" />
                                </div>

                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-transparent group-hover:border-border transition-colors">
                                    <button
                                        onClick={() => handleDelete(book.id)}
                                        className="text-muted-foreground hover:text-destructive p-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-md -ml-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <Link href={`/library/${book.id}`}>
                                        <Button variant="secondary" size="sm" className="gap-2 font-medium">
                                            {book.last_read ? 'Continue' : 'Start Reading'}
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Upload Modal */}
            <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Upload PDF Book</DialogTitle>
                    </DialogHeader>
                    <div
                        className="flex items-center justify-center w-full mt-4"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]);
                        }}
                    >
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 hover:border-border/80 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {uploading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4" />
                                        <p className="mb-2 text-sm text-muted-foreground">Uploading and parsing PDF...</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-10 h-10 text-muted-foreground mb-4" />
                                        <p className="mb-2 text-sm text-foreground"><span className="font-bold">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs text-muted-foreground">PDF file (Max 50MB)</p>
                                    </>
                                )}
                            </div>
                            <input
                                id="dropzone-file"
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                disabled={uploading}
                                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                                ref={fileInputRef}
                            />
                        </label>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
