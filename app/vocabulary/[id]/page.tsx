'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Volume2, Pencil, Trash2, BookOpen, RotateCcw } from 'lucide-react';
import { POS_LABELS, LEVEL_COLORS, type MorphemeToken } from '@/lib/hangul';
import { STATE_LABELS } from '@/lib/fsrs';
import { MorphemeBreakdown } from '@/components/vocabulary/MorphemeBreakdown';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/i18n';

interface WordDetail {
    word: {
        id: number;
        hangul: string;
        hanja?: string;
        pos?: string;
        level?: string;
        frequency_rank?: number;
        stem?: string;
        irregular_type?: string;
        pronunciation?: string;
        notes?: string;
        audio_url?: string;
    };
    definitions: Array<{ id: number; definition_en?: string; definition_ko?: string; order_num?: number }>;
    examples: Array<{ id: number; example_ko?: string; example_en?: string }>;
    reviews: Array<{ id: number; review_mode: string; state: number; reps: number; due: number }>;
    linkedSentences: Array<{ id: number; korean: string; natural_translation: string }>;
}

interface Props {
    params: Promise<{ id: string }>;
}

export default function WordDetailPage({ params }: Props) {
    const { lang, t } = useLang();
    const { id } = use(params);
    const [data, setData] = useState<WordDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetch(`/api/words/${id}`)
            .then(r => r.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const handleDelete = async () => {
        if (!confirm(t({ ko: '이 단어를 삭제할까요?', en: 'Delete this word?' }))) return;
        await fetch(`/api/words/${id}`, { method: 'DELETE' });
        toast.success(t({ ko: '단어가 삭제되었습니다', en: 'Word deleted' }));
        router.push('/vocabulary');
    };

    const handlePlayAudio = () => {
        if (data?.word.audio_url) {
            const audio = new Audio(data.word.audio_url);
            audio.play().catch(() => { });
        }
    };

    if (loading) {
        return (
            <div className="p-6 max-w-3xl mx-auto space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }

    if (!data) return <div className="p-8 text-center text-muted-foreground">{t({ ko: '단어를 찾을 수 없어요', en: 'Word not found' })}</div>;

    const { word, definitions, examples, reviews: reviewCards, linkedSentences } = data;

    return (
        <div className="p-6 max-w-3xl mx-auto animate-fade-in">
            {/* Back button */}
            <Link href="/vocabulary">
                <Button variant="ghost" size="sm" className="gap-2 mb-6 text-muted-foreground">
                    <ArrowLeft className="w-4 h-4" />
                    {t({ ko: '단어장', en: 'Vocabulary' })}
                </Button>
            </Link>

            {/* Word header */}
            <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1
                            className="text-6xl font-medium text-foreground korean"
                            lang="ko"
                            style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                        >
                            {word.hangul}
                        </h1>
                        {word.hanja && (
                            <span className="text-2xl text-muted-foreground">{word.hanja}</span>
                        )}
                        {word.audio_url && (
                            <button
                                onClick={handlePlayAudio}
                                className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                            >
                                <Volume2 className="w-4 h-4 text-muted-foreground" />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {word.pos && (
                            <Badge variant="outline" className="text-xs">
                                {POS_LABELS[word.pos] || word.pos}
                            </Badge>
                        )}
                        {word.level && (
                            <Badge variant="outline" className={cn('text-xs', LEVEL_COLORS[word.level])}>
                                {word.level}
                            </Badge>
                        )}
                        {word.frequency_rank && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                {t({ ko: '빈도 #', en: 'Freq #' })}{word.frequency_rank.toLocaleString()}
                            </Badge>
                        )}
                        {word.irregular_type && (
                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                {t({ ko: '불규칙: ', en: 'Irregular: ' })}{word.irregular_type}
                            </Badge>
                        )}
                    </div>
                </div>
                <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={handleDelete}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {/* Stem breakdown */}
            {word.stem && (
                <div className="mb-6">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{t({ ko: '형태소', en: 'Morphemes' })}</p>
                    <MorphemeBreakdown
                        morphemes={[
                            { morpheme: word.stem, type: word.pos === 'verb' ? 'verb_stem' : 'noun_stem' },
                            word.hangul.endsWith('다') ? { morpheme: '다', type: 'ending', label: 'dict.' } : null,
                        ].filter(Boolean) as MorphemeToken[]}
                    />
                </div>
            )}

            <Separator className="mb-6" />

            {/* Definitions */}
            {definitions.length > 0 && (
                <div className="mb-6">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">{t({ ko: '뜻 / Definitions', en: 'Definitions' })}</p>
                    <div className="space-y-3">
                        {definitions.map((def, i) => (
                            <div key={def.id} className="flex gap-3">
                                <span className="text-xs text-muted-foreground font-mono pt-0.5 shrink-0">{i + 1}.</span>
                                <div>
                                    {def.definition_en && (
                                        <p className="text-sm font-medium text-foreground">{def.definition_en}</p>
                                    )}
                                    {def.definition_ko && (
                                        <p
                                            className="text-xs text-muted-foreground mt-0.5 korean"
                                            lang="ko"
                                            style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                                        >
                                            {def.definition_ko}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Notes */}
            {word.notes && (
                <div className="mb-6">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{t({ ko: '메모', en: 'Notes' })}</p>
                    <p className="text-sm text-muted-foreground">{word.notes}</p>
                </div>
            )}

            {/* Examples */}
            {examples.length > 0 && (
                <div className="mb-6">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">{t({ ko: '예문', en: 'Examples' })}</p>
                    <div className="space-y-3">
                        {examples.map(ex => (
                            <div key={ex.id} className="bg-muted/40 rounded-lg px-4 py-3 border border-border/50">
                                {ex.example_ko && (
                                    <p
                                        className="text-sm korean"
                                        lang="ko"
                                        style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                                    >
                                        {ex.example_ko}
                                    </p>
                                )}
                                {ex.example_en && (
                                    <p className="text-xs text-muted-foreground mt-1">{ex.example_en}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Review state */}
            {reviewCards.length > 0 && (
                <div className="mb-6">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">{t({ ko: '복습 상태', en: 'Review State' })}</p>
                    <div className="flex gap-3 flex-wrap">
                        {reviewCards.map(rev => {
                            const stateInfo = STATE_LABELS[rev.state as keyof typeof STATE_LABELS];
                            const nextDue = new Date(rev.due * 1000);
                            return (
                                <Card key={rev.id} className="px-3 py-2 flex gap-3 items-center">
                                    <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs font-medium">{rev.review_mode}</p>
                                        <div className="flex gap-2 items-center">
                                            <Badge variant="outline" className={cn('text-[10px] h-4 px-1', {
                                                'text-gray-500': rev.state === 0,
                                                'text-amber-600': rev.state === 1,
                                                'text-green-600': rev.state === 2,
                                                'text-orange-600': rev.state === 3,
                                            })}>
                                                {stateInfo?.ko}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground">
                                                {nextDue <= new Date() ? t({ ko: '지금 복습 가능', en: 'Due now' }) : nextDue.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US')}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Linked Sentences */}
            {linkedSentences.length > 0 && (
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">{t({ ko: '이 단어가 포함된 문장', en: 'Sentences containing this word' })}</p>
                    <div className="space-y-2">
                        {linkedSentences.map(s => (
                            <Link key={s.id} href={`/sentences/${s.id}`}>
                                <div className="bg-muted/30 rounded-lg px-4 py-3 hover:bg-muted/60 transition-colors border border-border/40 group cursor-pointer">
                                    <p
                                        className="text-sm korean"
                                        lang="ko"
                                        style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                                    >
                                        {s.korean}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{s.natural_translation}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
