'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Volume2, Layers, Loader2 } from 'lucide-react';
import { LEVEL_COLORS, type MorphemeToken } from '@/lib/hangul';
import { MorphemeBreakdown } from '@/components/vocabulary/MorphemeBreakdown';
import { cn } from '@/lib/utils';
import { KoreanText } from '@/components/ui/korean-text';

interface Props { params: Promise<{ id: string }> }

const ROLE_LABELS: Record<string, string> = {
    subject: '주어', object: '목적어', predicate: '서술어',
    topic: '주제어', location: '장소', time: '시간',
    modifier: '수식어', connector: '연결어',
};

export default function SentenceDetailPage({ params }: Props) {
    const { id } = use(params);
    const [data, setData] = useState<{
        sentence: { id: number; korean: string; natural_translation: string; literal_translation?: string; level?: string; notes?: string; audio_url?: string };
        tokens: Array<{ sw: { position?: number; surface_form?: string; grammatical_role?: string; particle_attached?: string; morpheme_breakdown?: string }; word?: { id: number; hangul: string; pos?: string } | null }>;
        grammarPatterns: Array<{ id: number; pattern: string; name_en: string; description: string }>;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        fetch(`/api/sentences/${id}`)
            .then(r => r.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const handlePlayAudio = async () => {
        setIsPlaying(true);
        try {
            const url = `/api/audio/sentence/${id}`;
            const audio = new Audio(url);
            audio.onended = () => setIsPlaying(false);
            audio.onerror = () => setIsPlaying(false);
            await audio.play();
        } catch {
            setIsPlaying(false);
        }
    };

    if (loading) return (
        <div className="p-6 max-w-3xl mx-auto space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    );

    if (!data?.sentence) return <div className="p-8 text-center text-muted-foreground">문장을 찾을 수 없어요</div>;

    const { sentence, tokens, grammarPatterns } = data;

    return (
        <div className="p-6 max-w-3xl mx-auto animate-fade-in">
            <Link href="/sentences">
                <Button variant="ghost" size="sm" className="gap-2 mb-6 text-muted-foreground">
                    <ArrowLeft className="w-4 h-4" />
                    문장 라이브러리
                </Button>
            </Link>

            {/* Main sentence */}
            <div className="mb-6">
                <div className="mb-4">
                    <KoreanText
                        text={sentence.korean}
                        enableHover={true}
                        className="text-3xl md:text-4xl font-medium leading-snug"
                    />
                </div>
                <p className="text-lg text-muted-foreground mb-2">{sentence.natural_translation}</p>
                {sentence.literal_translation && (
                    <p className="text-sm text-muted-foreground/70 italic">{sentence.literal_translation}</p>
                )}
                <div className="flex items-center gap-2 mt-3">
                    {sentence.level && (
                        <Badge variant="outline" className={cn('text-xs', LEVEL_COLORS[sentence.level] || '')}>
                            {sentence.level}
                        </Badge>
                    )}
                    <button
                        onClick={handlePlayAudio}
                        disabled={isPlaying}
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        {isPlaying ? <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" /> : <Volume2 className="w-4 h-4 text-muted-foreground" />}
                    </button>
                </div>
            </div>

            <Separator className="mb-6" />

            {/* Token breakdown table */}
            {tokens.length > 0 && (
                <div className="mb-6">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">어절 분석</p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border">
                                    {['표층형', '기본형', '품사', '문법 역할', '형태소'].map(h => (
                                        <th key={h} className="text-left text-xs text-muted-foreground font-medium py-2 px-3 whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tokens
                                    .sort((a, b) => (a.sw.position ?? 0) - (b.sw.position ?? 0))
                                    .map((t, i) => {
                                        let morphemes: MorphemeToken[] = [];
                                        try {
                                            if (t.sw.morpheme_breakdown) {
                                                morphemes = JSON.parse(t.sw.morpheme_breakdown);
                                            }
                                        } catch { }

                                        return (
                                            <tr key={i} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                                                <td className="py-2.5 px-3">
                                                    <span
                                                        className="font-medium korean"
                                                        lang="ko"
                                                        style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                                                    >
                                                        {t.sw.surface_form}
                                                    </span>
                                                    {t.sw.particle_attached && (
                                                        <span className="text-xs text-muted-foreground ml-1">({t.sw.particle_attached})</span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    {t.word ? (
                                                        <Link href={`/vocabulary/${t.word.id}`} className="text-primary hover:underline korean" lang="ko" style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}>
                                                            {t.word.hangul}
                                                        </Link>
                                                    ) : '—'}
                                                </td>
                                                <td className="py-2.5 px-3 text-xs text-muted-foreground">
                                                    {t.word?.pos || '—'}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    {t.sw.grammatical_role ? (
                                                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                                                            {ROLE_LABELS[t.sw.grammatical_role] || t.sw.grammatical_role}
                                                        </Badge>
                                                    ) : '—'}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    {morphemes.length > 0 ? (
                                                        <MorphemeBreakdown morphemes={morphemes} />
                                                    ) : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Grammar patterns */}
            {grammarPatterns.length > 0 && (
                <div className="mb-6">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">사용된 문법 패턴</p>
                    <div className="space-y-2">
                        {grammarPatterns.map(gp => (
                            <Link key={gp.id} href={`/grammar/${gp.id}`}>
                                <Card className="px-4 py-3 hover:border-primary/30 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <code
                                            className="text-sm font-mono text-primary"
                                            lang="ko"
                                            style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                                        >
                                            {gp.pattern}
                                        </code>
                                        <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">{gp.name_en}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{gp.description}</p>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Notes */}
            {sentence.notes && (
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">메모</p>
                    <p className="text-sm text-muted-foreground">{sentence.notes}</p>
                </div>
            )}
        </div>
    );
}
