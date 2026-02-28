'use client';

import { use, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { AddWordForm } from '@/components/vocabulary/AddWordForm';
import { AddSentenceForm } from '@/components/sentences/AddSentenceForm';
import dynamic from 'next/dynamic';

const PdfReader = dynamic(() => import('@/components/library/PdfReader'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
        </div>
    )
});

interface BookProgress {
    id: number;
    title: string;
    total_pages: number | null;
    current_page: number | null;
}

export default function ReadingViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [book, setBook] = useState<BookProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [pageNum, setPageNum] = useState(1);

    // Mining states
    const [selectedWord, setSelectedWord] = useState('');
    const [selectedSentence, setSelectedSentence] = useState('');
    const [showWordModal, setShowWordModal] = useState(false);
    const [showSentenceModal, setShowSentenceModal] = useState(false);
    const [scale, setScale] = useState(1.2);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initial load
    useEffect(() => {
        fetch(`/api/library/${id}`)
            .then(r => r.json())
            .then(data => {
                setBook(data);
                const cp = data.current_page || 1;
                setPageNum(cp);
            })
            .catch(() => toast.error('Failed to load book metadata'))
            .finally(() => setLoading(false));
    }, [id]);

    const handlePageChange = (p: number) => {
        setPageNum(p);
        fetch(`/api/library/${id}/progress`, {
            method: 'POST',
            body: JSON.stringify({ page: p })
        }).catch(console.error);
    };

    const handlePrev = () => {
        if (pageNum > 1) handlePageChange(pageNum - 1);
    };

    const handleNext = () => {
        if (book?.total_pages && pageNum < book.total_pages) handlePageChange(pageNum + 1);
    };

    const handleTextSelection = () => {
        const selection = window.getSelection()?.toString();
        if (selection && selection.trim().length > 0) {
            const text = selection.trim();
            // Check if it has Korean characters
            if (/[가-힣]/.test(text)) {
                if (text.includes(' ') || text.length > 10) {
                    setSelectedSentence(text);
                    setShowSentenceModal(true);
                } else {
                    setSelectedWord(text.replace(/[.,!?()[\]{}"']/g, ''));
                    setShowWordModal(true);
                }
            }
        }
    };

    if (loading) return (
        <div className="p-8 max-w-6xl mx-auto space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-[60vh] w-full" />
        </div>
    );

    if (!book) return <div className="p-8 text-center">Book not found.</div>;

    const total = book.total_pages || pageNum;
    const progressPct = Math.round((pageNum / total) * 100);

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
            {/* Top Toolbar */}
            <div className="flex-none border-b border-border bg-background/95 backdrop-blur z-10 p-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/library">
                            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                                <ArrowLeft className="w-4 h-4" />
                                Library
                            </Button>
                        </Link>
                        <h1 className="font-medium text-lg hidden sm:block truncate max-w-[200px] md:max-w-sm">{book.title}</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setScale(s => Math.max(0.5, s - 0.2))}>
                                -
                            </Button>
                            <span className="text-sm font-mono">{Math.round(scale * 100)}%</span>
                            <Button variant="outline" size="sm" onClick={() => setScale(s => Math.min(3, s + 0.2))}>
                                +
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="max-w-6xl mx-auto mt-3 flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono">{pageNum}</span>
                    <Progress value={progressPct} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground font-mono">{total}</span>
                </div>
            </div>

            {/* Reading Content Area */}
            <div
                className="flex-1 overflow-y-auto w-full flex justify-center bg-muted/30"
                onMouseUp={handleTextSelection}
                ref={containerRef}
            >
                <div className="p-6 md:p-12 min-h-full pb-32 flex justify-center">
                    <PdfReader
                        fileUrl={`/api/library/${id}/file`}
                        pageNum={pageNum}
                        scale={scale}
                    />
                </div>
            </div>

            {/* Bottom Nav / Pagination */}
            <div className="flex-none border-t border-border bg-background p-4 flex justify-between items-center z-10">
                <Button
                    variant="outline"
                    onClick={handlePrev}
                    disabled={pageNum <= 1}
                    className="gap-2"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Prev Page
                </Button>

                <div className="flex items-center gap-2">
                    <span className="text-sm">Page</span>
                    <Input
                        type="number"
                        value={pageNum}
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val && val >= 1 && val <= total) {
                                setPageNum(val);
                                // Optional debounce
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handlePageChange(pageNum);
                        }}
                        className="w-16 h-8 text-center p-1"
                        min={1}
                        max={total}
                    />
                    <span className="text-sm text-muted-foreground">of {total}</span>
                </div>

                <Button
                    variant="outline"
                    onClick={handleNext}
                    disabled={pageNum >= total}
                    className="gap-2"
                >
                    Next Page
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>

            {/* Word Mining Popover / Modal (using Dialog for now to reuse AddWordForm) */}
            {showWordModal && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-fade-in relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowWordModal(false)}
                            className="absolute top-4 right-4"
                        >
                            Cancel
                        </Button>
                        <h2 className="text-2xl font-bold mb-4">Mine Word</h2>
                        <AddWordForm
                            initialHangul={selectedWord}
                            onSuccess={() => {
                                toast.success('Word added to vocabulary!');
                                setShowWordModal(false);
                            }}
                            onCancel={() => setShowWordModal(false)}
                        />
                    </Card>
                </div>
            )}

            {/* Sentence Mining Modal */}
            {showSentenceModal && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-fade-in relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSentenceModal(false)}
                            className="absolute top-4 right-4"
                        >
                            Cancel
                        </Button>
                        <h2 className="text-2xl font-bold mb-4">Mine Sentence</h2>
                        <AddSentenceForm
                            initialKorean={selectedSentence}
                            onSuccess={() => {
                                toast.success('Sentence added to database!');
                                setShowSentenceModal(false);
                            }}
                            onCancel={() => setShowSentenceModal(false)}
                        />
                    </Card>
                </div>
            )}
        </div>
    );
}
