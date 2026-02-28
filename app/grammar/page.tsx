'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, Layers, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LEVEL_COLORS } from '@/lib/hangul';
import { AddGrammarForm } from '@/components/grammar/AddGrammarForm';
import { useLang } from '@/lib/i18n';
import { KoreanText } from '@/components/ui/korean-text';

interface GrammarPattern {
    id: number;
    pattern: string;
    name_en: string;
    name_ko?: string;
    description: string;
    level?: string;
    category?: string;
    formality?: string;
    example_pattern_use?: string;
    sentence_count: number;
}

const CATEGORY_COLORS: Record<string, string> = {
    particle: 'bg-rose-600 text-white border-rose-700',
    verb_ending: 'bg-blue-600 text-white border-blue-700',
    tense: 'bg-amber-600 text-white border-amber-700',
    honorific: 'bg-teal-600 text-white border-teal-700',
    connector: 'bg-orange-600 text-white border-orange-700',
    aspect: 'bg-purple-600 text-white border-purple-700',
    modal: 'bg-indigo-600 text-white border-indigo-700',
    negation: 'bg-red-600 text-white border-red-700',
};

export default function GrammarPage() {
    const { lang, t } = useLang();
    const [patterns, setPatterns] = useState<GrammarPattern[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterLevel, setFilterLevel] = useState('');
    const [showAdd, setShowAdd] = useState(false);

    const fetchPatterns = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('q', search);
            if (filterCategory) params.set('category', filterCategory);
            if (filterLevel) params.set('level', filterLevel);
            params.set('limit', '100');

            const res = await fetch(`/api/grammar?${params}`);
            const data = await res.json();
            setPatterns(data.patterns ?? []);
            setTotal(data.total ?? 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [search, filterCategory, filterLevel]);

    useEffect(() => { fetchPatterns(); }, [fetchPatterns]);

    const categories = ['particle', 'verb_ending', 'tense', 'honorific', 'connector', 'aspect', 'modal', 'negation'];
    const levels = ['TOPIK-I-1', 'TOPIK-I-2', 'TOPIK-II-3', 'TOPIK-II-4', 'custom'];

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
                            {t({ ko: '문법', en: 'Grammar' })}
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            {loading ? '…' : `${total}${t({ ko: '개', en: '' })}`} · Grammar Patterns
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowAdd(true)}
                        className="gap-2 bg-primary hover:bg-primary/90"
                        size="sm"
                    >
                        <Plus className="w-4 h-4" />
                        {t({ ko: '패턴 추가', en: 'Add Pattern' })}
                    </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder={t({ ko: '패턴 검색...', en: 'Search patterns...' })}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    {/* Category filter pills */}
                    <div className="flex gap-1.5 flex-wrap">
                        <button
                            onClick={() => setFilterCategory('')}
                            className={cn(
                                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                                !filterCategory ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-foreground'
                            )}
                        >
                            {t({ ko: '전체', en: 'All' })}
                        </button>
                        {categories.slice(0, 4).map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat === filterCategory ? '' : cat)}
                                className={cn(
                                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                                    filterCategory === cat
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'border-border text-muted-foreground hover:border-foreground'
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Pattern grid */}
            <div className="flex-1 overflow-auto p-6">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
                    </div>
                ) : patterns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                        <Layers className="w-12 h-12 text-muted-foreground/30" />
                        <div>
                            <p className="font-medium">{t({ ko: '문법 패턴이 없어요', en: 'No grammar patterns' })}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {t({ ko: '설정에서 데이터베이스를 초기화하면 기본 문법 패턴이 로드됩니다.', en: 'Initialize the database in Settings to load default grammar patterns.' })}
                            </p>
                        </div>
                        <Button onClick={() => setShowAdd(true)} className="bg-primary hover:bg-primary/90">
                            {t({ ko: '패턴 추가하기', en: 'Add Pattern' })}
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {patterns.map(p => (
                            <Link key={p.id} href={`/grammar/${p.id}`}>
                                <Card className="p-5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full flex flex-col group">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <code
                                            className="text-lg font-mono text-primary font-semibold leading-tight"
                                            lang="ko"
                                            style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                                        >
                                            {p.pattern}
                                        </code>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                                    </div>

                                    <p className="text-sm font-medium text-foreground mb-1">{p.name_en}</p>
                                    {p.name_ko && (
                                        <p
                                            className="text-xs text-muted-foreground mb-2 korean"
                                            lang="ko"
                                            style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                                        >
                                            {p.name_ko}
                                        </p>
                                    )}

                                    <p className="text-xs text-muted-foreground line-clamp-2 flex-1 leading-relaxed">
                                        {p.description}
                                    </p>

                                    {p.example_pattern_use && (
                                        <div className="mt-3 border-l-2 border-primary/30 pl-3 italic">
                                            <KoreanText
                                                text={p.example_pattern_use}
                                                enableHover={true}
                                                className="text-sm text-foreground/80"
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                                        {p.level && (
                                            <Badge variant="outline" className={cn('text-[10px] h-4 px-1.5', LEVEL_COLORS[p.level.startsWith('TOPIK-I-') ? 'TOPIK-I' : 'TOPIK-II'])}>
                                                {p.level}
                                            </Badge>
                                        )}
                                        {p.category && (
                                            <Badge variant="outline" className={cn('text-[10px] h-4 px-1.5', CATEGORY_COLORS[p.category] || '')}>
                                                {p.category}
                                            </Badge>
                                        )}
                                        {p.sentence_count > 0 && (
                                            <span className="text-[10px] text-muted-foreground ml-auto">
                                                {p.sentence_count} {t({ ko: '문장', en: 'Sentences' })}
                                            </span>
                                        )}
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Grammar Dialog */}
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle lang={lang}>{t({ ko: '문법 패턴 추가', en: 'Add Grammar Pattern' })}</DialogTitle>
                    </DialogHeader>
                    <AddGrammarForm
                        onSuccess={() => { setShowAdd(false); fetchPatterns(); }}
                        onCancel={() => setShowAdd(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
