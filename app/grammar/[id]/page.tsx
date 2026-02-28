'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, AlignLeft } from 'lucide-react';
import { LEVEL_COLORS } from '@/lib/hangul';
import { cn } from '@/lib/utils';
import { KoreanText } from '@/components/ui/korean-text';
import { AudioButton } from '@/components/ui/audio-button';

interface Props { params: Promise<{ id: string }> }

export default function GrammarDetailPage({ params }: Props) {
    const { id } = use(params);
    const [data, setData] = useState<{ pattern: Record<string, unknown>; linkedSentences: Array<{ id: number; korean: string; natural_translation: string }> } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/grammar/${id}`)
            .then(r => r.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="p-6 max-w-3xl mx-auto space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
    );

    if (!data?.pattern) return <div className="p-8 text-center text-muted-foreground">패턴을 찾을 수 없어요</div>;

    const p = data.pattern as {
        id: number; pattern: string; name_en: string; name_ko?: string;
        description: string; level?: string; category?: string; formality?: string;
        example_pattern_use?: string; notes?: string;
    };

    return (
        <div className="p-6 max-w-3xl mx-auto animate-fade-in">
            <Link href="/grammar">
                <Button variant="ghost" size="sm" className="gap-2 mb-6 text-muted-foreground">
                    <ArrowLeft className="w-4 h-4" />
                    문법
                </Button>
            </Link>

            {/* Header */}
            <div className="mb-6">
                <code
                    className="text-4xl font-mono text-primary font-semibold block mb-2"
                    lang="ko"
                    style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                >
                    {p.pattern}
                </code>
                <h1 className="text-xl font-semibold text-foreground">{p.name_en}</h1>
                {p.name_ko && (
                    <p
                        className="text-sm text-muted-foreground mt-0.5 korean"
                        lang="ko"
                        style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                    >
                        {p.name_ko}
                    </p>
                )}
                <div className="flex gap-2 mt-3 flex-wrap">
                    {p.level && (
                        <Badge variant="outline" className={cn('text-xs', LEVEL_COLORS[p.level.startsWith('TOPIK-I-') ? 'TOPIK-I' : 'TOPIK-II'])}>
                            {p.level}
                        </Badge>
                    )}
                    {p.category && <Badge variant="outline" className="text-xs">{p.category}</Badge>}
                    {p.formality && <Badge variant="outline" className="text-xs text-muted-foreground">{p.formality}</Badge>}
                </div>
            </div>

            <Separator className="mb-6" />

            {/* Description */}
            <div className="mb-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">설명</p>
                <p className="text-sm text-foreground leading-relaxed">{p.description}</p>
            </div>

            {/* Example */}
            {p.example_pattern_use && (
                <div className="mb-6">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">예시</p>
                    <div className="bg-muted/40 rounded-lg px-4 py-3 border-l-2 border-primary/40 flex items-center justify-between gap-4">
                        <KoreanText
                            text={p.example_pattern_use}
                            enableHover={true}
                            className="text-base"
                        />
                        <AudioButton type="grammar" id={p.id} className="w-8 h-8 shrink-0" iconSize={16} />
                    </div>
                </div>
            )}

            {p.notes && (
                <div className="mb-6">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">노트</p>
                    <p className="text-sm text-muted-foreground">{p.notes}</p>
                </div>
            )}

            <Separator className="mb-6" />

            {/* Linked Sentences */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">이 패턴이 사용된 문장</p>
                    <Link href="/sentences">
                        <Button variant="ghost" size="sm" className="text-xs gap-1">
                            <AlignLeft className="w-3.5 h-3.5" />
                            문장 추가
                        </Button>
                    </Link>
                </div>
                {data.linkedSentences.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">아직 연결된 문장이 없어요</p>
                ) : (
                    <div className="space-y-2">
                        {data.linkedSentences.map(s => (
                            <Link key={s.id} href={`/sentences/${s.id}`}>
                                <Card className="px-4 py-3 hover:border-primary/30 transition-colors cursor-pointer group">
                                    <KoreanText
                                        text={s.korean}
                                        enableHover={true}
                                        className="text-sm"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">{s.natural_translation}</p>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
