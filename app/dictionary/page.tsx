'use client';

import { useState, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, BookOpen, Loader2, Volume2 } from 'lucide-react';
import { AddWordForm } from '@/components/vocabulary/AddWordForm';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/i18n';

interface DictResult {
    target_code: string;
    word: string;
    pos: string;
    pronunciation: string;
    definitions: Array<{
        order: number;
        definition_ko: string;
        definition_en?: string;
        examples: string[];
    }>;
}

export default function DictionaryPage() {
    const { lang, t } = useLang();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<DictResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [addWordData, setAddWordData] = useState<{
        hangul: string;
        definitions: Array<{ definition_ko: string; definition_en: string; order_num: number; krdict_target_code?: string }>;
    } | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const router = useRouter();

    const search = useCallback(async (q: string) => {
        if (!q.trim()) {
            setResults([]);
            setSearched(false);
            return;
        }
        setLoading(true);
        setSearched(true);
        try {
            const res = await fetch(`/api/dictionary/search?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            setResults(data.results ?? []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleInput = (value: string) => {
        setQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => search(value), 400);
    };

    const handleAddToVocabulary = (result: DictResult) => {
        setAddWordData({
            hangul: result.word,
            definitions: result.definitions.map(d => ({
                definition_ko: d.definition_ko,
                definition_en: d.definition_en || '',
                order_num: d.order,
                krdict_target_code: result.target_code,
            })),
        });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-4">
                <div className="mb-4">
                    <h1
                        className="text-xl font-semibold"
                        lang={lang}
                        style={{ fontFamily: lang === 'ko' ? 'var(--font-noto-kr), Noto Sans KR, sans-serif' : 'inherit' }}
                    >
                        {t({ ko: '한국어 사전', en: 'Korean Dictionary' })}
                    </h1>
                    <p className="text-xs text-muted-foreground">KRDICT · Korean Learners' Dictionary</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
                    <Input
                        placeholder={t({ ko: '한국어로 검색...', en: 'Search in Korean...' })}
                        value={query}
                        onChange={e => handleInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && search(query)}
                        className="pl-9 pr-9 text-lg"
                        lang="ko"
                        style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                    />
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-auto p-6">
                {!searched && !loading && (
                    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Search className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium">{t({ ko: '한국어 단어를 검색하세요', en: 'Search for a Korean word' })}</p>
                            <p className="text-sm text-muted-foreground mt-1">{t({ ko: 'KRDICT에서 뜻, 발음, 예문을 가져옵니다', en: 'Fetches meanings, pronunciation, and examples from KRDICT' })}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {['먹다', '공부하다', '친구', '학교', '사랑'].map(w => (
                                <button
                                    key={w}
                                    onClick={() => { setQuery(w); search(w); }}
                                    className="px-3 py-1.5 rounded-full border border-border text-sm hover:border-primary/50 transition-colors korean"
                                    lang="ko"
                                    style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                                >
                                    {w}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {searched && !loading && results.length === 0 && (
                    <div className="text-center py-16">
                        <p className="font-medium">{t({ ko: '검색 결과가 없어요', en: 'No results found' })}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {t({ ko: 'KRDICT API 키가 설정되지 않았거나 결과가 없습니다.', en: 'KRDICT API key is not set, or no results found.' })}
                        </p>
                    </div>
                )}

                {loading && (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
                    </div>
                )}

                {!loading && results.length > 0 && (
                    <div className="space-y-3">
                        {results.map((result, i) => (
                            <Card key={i} className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        {/* Word header */}
                                        <div className="flex items-center gap-3 mb-2">
                                            <span
                                                className="text-2xl font-medium korean"
                                                lang="ko"
                                                style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                                            >
                                                {result.word}
                                            </span>
                                            {result.pronunciation && result.pronunciation !== result.word && (
                                                <span
                                                    className="text-sm text-muted-foreground korean"
                                                    lang="ko"
                                                    style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                                                >
                                                    [{result.pronunciation}]
                                                </span>
                                            )}
                                            {result.pos && (
                                                <Badge variant="outline" className="text-xs">{result.pos}</Badge>
                                            )}
                                        </div>

                                        {/* Definitions */}
                                        <div className="space-y-2">
                                            {result.definitions.slice(0, 3).map((def, j) => (
                                                <div key={j} className="flex gap-2">
                                                    <span className="text-xs text-muted-foreground font-mono pt-0.5 shrink-0">{j + 1}.</span>
                                                    <div>
                                                        {def.definition_en && (
                                                            <p className="text-sm font-medium">{def.definition_en}</p>
                                                        )}
                                                        <p
                                                            className="text-xs text-muted-foreground mt-0.5 korean"
                                                            lang="ko"
                                                            style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                                                        >
                                                            {def.definition_ko}
                                                        </p>
                                                        {def.examples[0] && (
                                                            <p
                                                                className="text-xs text-muted-foreground/70 mt-1 italic korean"
                                                                lang="ko"
                                                                style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                                                            >
                                                                {def.examples[0]}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs gap-1.5 whitespace-nowrap"
                                            onClick={() => handleAddToVocabulary(result)}
                                        >
                                            <BookOpen className="w-3.5 h-3.5" />
                                            {t({ ko: '단어장 추가', en: 'Add to Vocabulary' })}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Add word dialog */}
            <Dialog open={!!addWordData} onOpenChange={() => setAddWordData(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle lang={lang}>{t({ ko: '단어장에 추가', en: 'Add to Vocabulary' })}</DialogTitle>
                    </DialogHeader>
                    {addWordData && (
                        <AddWordForm
                            initialHangul={addWordData.hangul}
                            initialDefinitions={addWordData.definitions}
                            onSuccess={(id) => {
                                setAddWordData(null);
                                router.push(`/vocabulary/${id}`);
                            }}
                            onCancel={() => setAddWordData(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
