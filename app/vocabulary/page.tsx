'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Volume2, ChevronRight, BookOpen, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { POS_LABELS, LEVEL_COLORS, jamoSearch } from '@/lib/hangul';
import { STATE_LABELS } from '@/lib/fsrs';
import { AddWordForm } from '@/components/vocabulary/AddWordForm';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useLang } from '@/lib/i18n';
import { AudioButton } from '@/components/ui/audio-button';

interface Word {
    id: number;
    hangul: string;
    hanja?: string;
    pos?: string;
    level?: string;
    frequency_rank?: number;
    notes?: string;
    created_at: number;
}

export default function VocabularyPage() {
    const { lang, t } = useLang();
    const [words, setWords] = useState<Word[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPos, setFilterPos] = useState<string>('');
    const [filterLevel, setFilterLevel] = useState<string>('');
    const [sortBy, setSortBy] = useState('created_at');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [page, setPage] = useState(1);
    const router = useRouter();

    const fetchWords = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.set('q', searchQuery);
            if (filterPos) params.set('pos', filterPos);
            if (filterLevel) params.set('level', filterLevel);
            params.set('sort', sortBy);
            params.set('limit', '200');
            params.set('page', '1');

            const res = await fetch(`/api/words?${params}`);
            const data = await res.json();
            setWords(data.words ?? []);
            setTotal(data.total ?? 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, filterPos, filterLevel, sortBy]);

    useEffect(() => {
        fetchWords();
    }, [fetchWords]);

    // Client-side jamo search on top of server results
    const filteredWords = searchQuery
        ? words.filter(w => jamoSearch(searchQuery, w.hangul) ||
            (w.notes && w.notes.toLowerCase().includes(searchQuery.toLowerCase())))
        : words;

    const parentRef = useRef<HTMLDivElement>(null);
    const rowVirtualizer = useVirtualizer({
        count: filteredWords.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 56,
        overscan: 10,
    });

    const posOptions = ['noun', 'verb', 'adjective', 'adverb', 'particle', 'determiner', 'interjection', 'pronoun', 'bound_noun', 'suffix'];
    const levelOptions = ['TOPIK-I', 'TOPIK-II', 'custom'];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1
                            className="text-xl font-semibold"
                            lang={lang}
                            style={{ fontFamily: lang === 'ko' ? 'var(--font-noto-kr), Noto Sans KR, sans-serif' : 'inherit' }}
                        >
                            {t({ ko: '단어장', en: 'Vocabulary' })}
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            {loading ? '…' : `${total.toLocaleString()}${t({ ko: '개', en: '' })}`} · Vocabulary
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowAddDialog(true)}
                        className="gap-2 bg-primary hover:bg-primary/90"
                        size="sm"
                    >
                        <Plus className="w-4 h-4" />
                        {t({ ko: '단어 추가', en: 'Add Word' })}
                    </Button>
                </div>

                {/* Search + filters */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder={t({ ko: '한국어로 검색... (자모 검색 지원)', en: 'Search words...' })}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-9"
                            lang="ko"
                            style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                        />
                    </div>
                    <Select value={filterPos || 'all'} onValueChange={v => setFilterPos(v === 'all' ? '' : v)}>
                        <SelectTrigger className="w-full sm:w-36">
                            <SelectValue placeholder="품사" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t({ ko: '전체 품사', en: 'All POS' })}</SelectItem>
                            {posOptions.map(p => (
                                <SelectItem key={p} value={p}>{POS_LABELS[p] || p}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterLevel || 'all'} onValueChange={v => setFilterLevel(v === 'all' ? '' : v)}>
                        <SelectTrigger className="w-full sm:w-36">
                            <SelectValue placeholder="레벨" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t({ ko: '전체 레벨', en: 'All Levels' })}</SelectItem>
                            {levelOptions.map(l => (
                                <SelectItem key={l} value={l}>{l}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full sm:w-36">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="created_at">{t({ ko: '최근 추가순', en: 'Recently Added' })}</SelectItem>
                            <SelectItem value="hangul">{t({ ko: '가나다순', en: 'Alphabetical' })}</SelectItem>
                            <SelectItem value="frequency_rank">{t({ ko: '빈도순', en: 'By Frequency' })}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Word list */}
            {loading ? (
                <div className="p-6 space-y-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 rounded-xl" />
                    ))}
                </div>
            ) : filteredWords.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
                    <BookOpen className="w-12 h-12 text-muted-foreground/30" />
                    <div>
                        <p className="font-medium">{t({ ko: '아직 단어가 없어요', en: 'No words yet' })}</p>
                        <p className="text-sm text-muted-foreground mt-1">{t({ ko: '단어를 추가하여 복습을 시작하세요.', en: 'Add words to start reviewing.' })}</p>
                    </div>
                    <Button onClick={() => setShowAddDialog(true)} className="bg-primary hover:bg-primary/90">
                        {t({ ko: '첫 단어 추가하기', en: 'Add First Word' })}
                    </Button>
                </div>
            ) : (
                <div ref={parentRef} className="flex-1 overflow-auto px-6 py-2">
                    <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                        {rowVirtualizer.getVirtualItems().map(virtualItem => {
                            const word = filteredWords[virtualItem.index];
                            return (
                                <div
                                    key={word.id}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: `${virtualItem.size}px`,
                                        transform: `translateY(${virtualItem.start}px)`,
                                    }}
                                >
                                    <div
                                        onClick={() => router.push(`/vocabulary/${word.id}`)}
                                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/50 rounded-xl transition-colors group text-left cursor-pointer"
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                router.push(`/vocabulary/${word.id}`);
                                            }
                                        }}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                                                <span
                                                    className="text-lg font-medium korean truncate"
                                                    lang="ko"
                                                    style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                                                >
                                                    {word.hangul}
                                                </span>
                                                <AudioButton
                                                    type="word"
                                                    id={word.id}
                                                    className="w-7 h-7 mx-1"
                                                    iconSize={14}
                                                />
                                                {word.hanja && (
                                                    <span className="text-sm text-muted-foreground">{word.hanja}</span>
                                                )}
                                                {word.pos && (
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                                                        {POS_LABELS[word.pos] || word.pos}
                                                    </Badge>
                                                )}
                                                {word.level && (
                                                    <Badge
                                                        variant="outline"
                                                        className={cn('text-[10px] h-4 px-1.5', LEVEL_COLORS[word.level])}
                                                    >
                                                        {word.level}
                                                    </Badge>
                                                )}
                                            </div>
                                            {word.notes && (
                                                <p className="text-xs text-muted-foreground mt-0.5 truncate">{word.notes}</p>
                                            )}
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Add Word Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle
                            lang={lang}
                            style={{ fontFamily: lang === 'ko' ? 'var(--font-noto-kr), Noto Sans KR, sans-serif' : 'inherit' }}
                        >
                            {t({ ko: '새 단어 추가', en: 'Add New Word' })}
                        </DialogTitle>
                    </DialogHeader>
                    <AddWordForm
                        onSuccess={() => {
                            setShowAddDialog(false);
                            fetchWords();
                        }}
                        onCancel={() => setShowAddDialog(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
