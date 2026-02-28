'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Headphones, AlertTriangle, Play } from 'lucide-react';
import { useLang } from '@/lib/i18n';

interface ListeningEpisodeWithProgress {
    id: number;
    title: string;
    series: string;
    level: string | null;
    episode_number: number | null;
    youtube_id: string;
    thumbnail_url: string | null;
    duration_seconds: number | null;
    description: string | null;
    added_at: number;
    progress: {
        last_position_seconds: number;
        completed: number;
    } | null;
}

export default function ListeningPage() {
    const { lang, t } = useLang();
    const [episodes, setEpisodes] = useState<ListeningEpisodeWithProgress[] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/listening')
            .then((r) => r.json())
            .then((data) => {
                setEpisodes(data.episodes ?? []);
            })
            .catch(() => {
                setEpisodes([]);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1
                        className="text-xl font-semibold flex items-center gap-2"
                        lang={lang}
                        style={{ fontFamily: lang === 'ko' ? 'var(--font-noto-kr), Noto Sans KR, sans-serif' : 'inherit' }}
                    >
                        <Headphones className="w-5 h-5 text-primary" />
                        {t({ ko: '듣기 연습', en: 'Listening Practice' })}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t({ ko: 'TTMIK 이야기 시리즈', en: 'TTMIK Iyagi Series · Beginner' })}
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="p-4 space-y-3">
                            <Skeleton className="w-full h-32 rounded-md" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {episodes?.map((ep) => {
                        const hasYoutube = !!ep.youtube_id;
                        const completed = ep.progress?.completed === 1;
                        const position = ep.progress?.last_position_seconds ?? 0;
                        const duration = ep.duration_seconds ?? 0;
                        const progressPct =
                            completed || duration === 0
                                ? completed
                                    ? 100
                                    : 0
                                : Math.min(Math.round((position / duration) * 100), 100);

                        const thumbUrl = hasYoutube
                            ? `https://img.youtube.com/vi/${ep.youtube_id}/mqdefault.jpg`
                            : null;

                        return (
                            <Card key={ep.id} className="p-4 flex flex-col gap-3">
                                <div className="flex gap-3">
                                    <div className="w-32 h-20 rounded-md overflow-hidden bg-muted flex items-center justify-center text-muted-foreground text-xs">
                                        {thumbUrl ? (
                                            <img
                                                src={thumbUrl}
                                                alt={ep.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                <AlertTriangle className="w-5 h-5" />
                                                <span>{t({ ko: 'YouTube ID 설정 필요', en: 'YouTube ID needed' })}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-muted-foreground mb-0.5">
                                            {ep.episode_number ? `Ep. ${ep.episode_number}` : ep.series}
                                        </p>
                                        <p className="text-sm font-medium line-clamp-2">{ep.title}</p>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                            {ep.level && (
                                                <span className="px-2 py-0.5 rounded-full bg-muted">
                                                    {ep.level}
                                                </span>
                                            )}
                                            {completed && (
                                                <span className="text-emerald-500">
                                                    {t({ ko: '완료', en: 'Completed' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {ep.progress && (
                                        <Progress value={progressPct} className="h-1.5" />
                                    )}
                                    <div className="flex gap-2">
                                        {hasYoutube ? (
                                            <Link href={`/listening/${ep.id}`} className="flex-1">
                                                <Button className="w-full gap-2" size="sm">
                                                    <Play className="w-4 h-4" />
                                                    {t({ ko: '시청하기', en: 'Watch' })}
                                                </Button>
                                            </Link>
                                        ) : (
                                            <Link href={`/listening/${ep.id}`} className="flex-1">
                                                <Button
                                                    className="w-full gap-2"
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                    {t({ ko: 'YouTube ID 설정', en: 'Set YouTube ID' })}
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

