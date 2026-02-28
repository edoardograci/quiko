'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, AlignLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LEVEL_COLORS } from '@/lib/hangul';
import { AddSentenceForm } from '@/components/sentences/AddSentenceForm';
import { useLang } from '@/lib/i18n';

interface Sentence {
    id: number;
    korean: string;
    natural_translation: string;
    level?: string;
    source?: string;
    created_at: number;
    grammarPatterns?: Array<{ id: number; pattern: string; name_en: string }>;
}

export default function SentencesPage() {
    const { lang, t } = useLang();
    const [sentences, setSentences] = useState<Sentence[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showAdd, setShowAdd] = useState(false);

    const fetchSentences = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('q', search);
            params.set('limit', '50');
            const res = await fetch(`/api/sentences?${params}`);
            const data = await res.json();
            setSentences(data.sentences ?? []);
            setTotal(data.total ?? 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => { fetchSentences(); }, [fetchSentences]);

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
                            {t({ ko: '문장 라이브러리', en: 'Sentence Library' })}
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            {loading ? '…' : `${total}${t({ ko: '개', en: '' })}`} · Sentence Library
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowAdd(true)}
                        className="gap-2 bg-primary hover:bg-primary/90"
                        size="sm"
                    >
                        <Plus className="w-4 h-4" />
                        {t({ ko: '문장 추가', en: 'Add Sentence' })}
                    </Button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder={t({ ko: '한국어 문장 검색...', en: 'Search Korean sentences...' })}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9"
                        lang="ko"
                        style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                    />
                </div>
            </div>

            {/* Card grid */}
            <div className="flex-1 overflow-auto p-6">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
                    </div>
                ) : sentences.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                        <AlignLeft className="w-12 h-12 text-muted-foreground/30" />
                        <div>
                            <p className="font-medium">{t({ ko: '아직 문장이 없어요', en: 'No sentences yet' })}</p>
                            <p className="text-sm text-muted-foreground mt-1">{t({ ko: '문장을 추가하여 학습을 시작하세요.', en: 'Add sentences to start learning.' })}</p>
                        </div>
                        <Button onClick={() => setShowAdd(true)} className="bg-primary hover:bg-primary/90">
                            {t({ ko: '첫 문장 추가하기', en: 'Add your first sentence' })}
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sentences.map(s => (
                            <Link key={s.id} href={`/sentences/${s.id}`}>
                                <Card className="p-5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full flex flex-col group">
                                    <p
                                        className="text-lg font-medium korean leading-snug mb-2"
                                        lang="ko"
                                        style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                                    >
                                        {s.korean}
                                    </p>
                                    <p className="text-sm text-muted-foreground flex-1">{s.natural_translation}</p>

                                    {/* Grammar pattern badges */}
                                    {s.grammarPatterns && s.grammarPatterns.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                            {s.grammarPatterns.slice(0, 3).map(gp => (
                                                <Badge
                                                    key={gp.id}
                                                    variant="outline"
                                                    className="text-[10px] h-5 px-2 bg-primary/5 border-primary/20 text-primary"
                                                >
                                                    <code lang="ko" style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}>
                                                        {gp.pattern}
                                                    </code>
                                                </Badge>
                                            ))}
                                            {s.grammarPatterns.length > 3 && (
                                                <Badge variant="outline" className="text-[10px] h-5 px-2">
                                                    +{s.grammarPatterns.length - 3}
                                                </Badge>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 mt-3">
                                        {s.level && (
                                            <Badge variant="outline" className={cn('text-[10px] h-4 px-1.5', LEVEL_COLORS[s.level] || '')}>
                                                {s.level}
                                            </Badge>
                                        )}
                                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Dialog */}
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle lang={lang} style={{ fontFamily: lang === 'ko' ? 'var(--font-noto-kr), Noto Sans KR, sans-serif' : 'inherit' }}>
                            {t({ ko: '새 문장 추가', en: 'Add New Sentence' })}
                        </DialogTitle>
                    </DialogHeader>
                    <AddSentenceForm
                        onSuccess={() => { setShowAdd(false); fetchSentences(); }}
                        onCancel={() => setShowAdd(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
