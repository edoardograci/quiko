'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Brain, BookOpen, AlignLeft, Layers,
    TrendingUp, Clock, Target, Zap,
    Calendar, ChevronRight, Flame, Headphones
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ReviewHeatmap } from '@/components/charts/ReviewHeatmap';
import { RetentionChart } from '@/components/charts/RetentionChart';
import { cn } from '@/lib/utils';
import { useLang } from '@/lib/i18n';

interface DashboardStats {
    dueCount: number;
    newCount: number;
    totalWords: number;
    totalSentences: number;
    totalGrammar: number;
    accuracy7d: number;
    heatmap: Array<{ day: number; count: number }>;
    upcoming: Array<{ day: number; count: number }>;
    recentWords: Array<{ id: number; hangul: string; notes?: string; pos?: string; level?: string }>;
    streakDays: number;
    reviewedToday: number;
    dailyGoal: number;
    listening?: {
        id: number;
        title: string;
        youtube_id: string;
        last_position_seconds: number;
        completed: number;
    } | null;
}

export default function DashboardPage() {
    const { lang, t } = useLang();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboard() {
            try {
                const [dueRes, statsRes, wordsRes] = await Promise.all([
                    fetch('/api/review/due?count_only=false&limit=100'),
                    fetch('/api/review/stats'),
                    fetch('/api/words?limit=5&sort=created_at'),
                ]);

                const due = await dueRes.json();
                const reviewStats = await statsRes.json();
                const wordsData = await wordsRes.json();

                // Count total items & listening progress
                const [sentRes, gramRes, listeningRes] = await Promise.all([
                    fetch('/api/sentences?limit=1'),
                    fetch('/api/grammar?limit=1'),
                    fetch('/api/listening'),
                ]);
                const sent = await sentRes.json();
                const gram = await gramRes.json();
                const listeningData = await listeningRes.json();

                const episodes = (listeningData.episodes ?? []) as Array<{
                    id: number;
                    title: string;
                    youtube_id: string;
                    progress: { last_position_seconds: number; completed: number; last_watched: number } | null;
                }>;

                const inProgress = episodes
                    .filter((e) => e.progress && e.progress.completed !== 1 && e.progress.last_position_seconds > 0)
                    .sort((a, b) => (b.progress!.last_watched - a.progress!.last_watched));

                const latestListening = inProgress.length > 0
                    ? {
                        id: inProgress[0].id,
                        title: inProgress[0].title,
                        youtube_id: inProgress[0].youtube_id,
                        last_position_seconds: inProgress[0].progress!.last_position_seconds,
                        completed: inProgress[0].progress!.completed,
                    }
                    : null;

                setStats({
                    dueCount: due.review ?? 0,
                    newCount: due.new ?? 0,
                    totalWords: wordsData.total ?? 0,
                    totalSentences: sent.total ?? 0,
                    totalGrammar: gram.total ?? 0,
                    accuracy7d: reviewStats.accuracy_7d ?? 0,
                    heatmap: reviewStats.heatmap ?? [],
                    upcoming: reviewStats.upcoming_reviews ?? [],
                    recentWords: wordsData.words?.slice(0, 5) ?? [],
                    streakDays: reviewStats.streak_days ?? 0,
                    reviewedToday: reviewStats.reviewed_today ?? 0,
                    dailyGoal: reviewStats.daily_goal ?? 20,
                    listening: latestListening,
                });
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchDashboard();
    }, []);

    const estimatedMinutes = stats ? Math.ceil((stats.dueCount + stats.newCount) * 10 / 60) : 0;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-foreground">{t({ ko: '오늘의 학습', en: "Today's Study" })}</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    {new Date().toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Daily Review Card */}
                    <Card className="p-6 border-primary/20 bg-gradient-to-br from-card to-primary/5">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2
                                    className="text-lg font-semibold"
                                    lang={lang}
                                    style={{ fontFamily: lang === 'ko' ? 'var(--font-noto-kr), Noto Sans KR, sans-serif' : 'inherit' }}
                                >
                                    {t({ ko: '오늘의 복습', en: 'Daily Review' })}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">Daily Review</p>
                            </div>
                            <Brain className="w-5 h-5 text-primary" />
                        </div>

                        {loading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-24" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        ) : (
                            <div className="mb-4">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-foreground">
                                        {(stats?.dueCount ?? 0) + (stats?.newCount ?? 0)}
                                    </span>
                                    <span className="text-sm text-muted-foreground">{t({ ko: '카드', en: 'cards' })}</span>
                                </div>
                                <div className="flex gap-3 mt-2">
                                    <span className="text-xs text-muted-foreground">
                                        {t({ ko: '복습', en: 'Review' })} <span className="font-medium text-foreground">{stats?.dueCount ?? 0}</span>
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {t({ ko: '신규', en: 'New' })} <span className="font-medium text-green-600 dark:text-green-400">{stats?.newCount ?? 0}</span>
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        <Clock className="inline w-3 h-3 mr-0.5" />~{estimatedMinutes}{lang === 'ko' ? '분' : 'm'}
                                    </span>
                                </div>
                            </div>
                        )}

                        <Link href="/review">
                            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                                <Brain className="w-4 h-4" />
                                <span lang={lang} style={{ fontFamily: lang === 'ko' ? 'var(--font-noto-kr), Noto Sans KR, sans-serif' : 'inherit' }}>
                                    {t({ ko: '복습 시작', en: 'Start Review' })}
                                </span>
                            </Button>
                        </Link>
                    </Card>

                    {/* Streak & Daily Goal */}
                    <Card className="p-6 relative overflow-hidden group border-orange-500/20">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                        <div className="flex items-center justify-between mb-4 relative">
                            <div>
                                <h3 className="text-sm font-medium flex items-center gap-2">
                                    <Flame className="w-4 h-4 text-orange-500" />
                                    {t({ ko: '연속 학습', en: 'Study Streak' })}
                                </h3>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-bold">{loading ? '-' : stats?.streakDays}</span>
                                    <span className="text-sm text-muted-foreground">{t({ ko: '일', en: 'days' })}</span>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-muted-foreground">{t({ ko: '오늘의 목표', en: 'Daily Goal' })}</span>
                                <span className="font-medium">
                                    {loading ? '-' : stats?.reviewedToday} / {loading ? '-' : stats?.dailyGoal}
                                </span>
                            </div>
                            <Progress
                                value={stats ? Math.min((stats.reviewedToday / stats.dailyGoal) * 100, 100) : 0}
                                className="h-2 bg-muted/50"
                            />
                            {stats && stats.reviewedToday >= stats.dailyGoal && (
                                <p className="text-[10px] text-green-500 mt-2 text-center animate-fade-in">
                                    {t({ ko: '오늘의 목표 달성! 멋져요!', en: 'Daily goal met! Awesome job!' })}
                                </p>
                            )}
                        </div>
                    </Card>

                    {/* Continue Listening */}
                    {stats?.listening && (
                        <Card className="p-4 flex items-center gap-3">
                            <div className="w-20 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                                {stats.listening.youtube_id ? (
                                    <img
                                        src={`https://img.youtube.com/vi/${stats.listening.youtube_id}/mqdefault.jpg`}
                                        alt={stats.listening.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Headphones className="w-6 h-6 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground mb-0.5">
                                    {t({ ko: '계속 듣기', en: 'Continue Listening' })}
                                </p>
                                <p className="text-sm font-medium truncate">
                                    {stats.listening.title}
                                </p>
                            </div>
                            <Link href={`/listening/${stats.listening.id}`}>
                                <Button size="sm" variant="outline" className="gap-1">
                                    <Headphones className="w-4 h-4" />
                                    {t({ ko: '이어보기', en: 'Continue' })}
                                </Button>
                            </Link>
                        </Card>
                    )}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: BookOpen, label: t({ ko: '단어', en: 'Words' }), value: stats?.totalWords ?? 0, href: '/vocabulary', color: 'text-blue-500' },
                            { icon: AlignLeft, label: t({ ko: '문장', en: 'Sentences' }), value: stats?.totalSentences ?? 0, href: '/sentences', color: 'text-green-500' },
                            { icon: Layers, label: t({ ko: '문법', en: 'Grammar' }), value: stats?.totalGrammar ?? 0, href: '/grammar', color: 'text-purple-500' },
                            { icon: Target, label: t({ ko: '정확도', en: 'Accuracy' }), value: `${stats?.accuracy7d ?? 0}%`, href: '/review', color: 'text-amber-500', sub: lang === 'ko' ? '7일' : '7d' },
                        ].map(({ icon: Icon, label, value, href, color, sub }) => (
                            <Link key={href} href={href}>
                                <Card className="p-4 hover:border-primary/30 transition-colors cursor-pointer group">
                                    <Icon className={cn('w-4 h-4 mb-2', color)} />
                                    <p className="text-xl font-bold">{loading ? '—' : value}</p>
                                    <p
                                        className="text-xs text-muted-foreground"
                                        lang={lang}
                                        style={{ fontFamily: lang === 'ko' ? 'var(--font-noto-kr), Noto Sans KR, sans-serif' : 'inherit' }}
                                    >
                                        {label}{sub && <span className="ml-1 opacity-60">{sub}</span>}
                                    </p>
                                </Card>
                            </Link>
                        ))}
                    </div>

                    {/* Upcoming reviews */}
                    <Card className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium">{t({ ko: '향후 7일 복습', en: 'Next 7 Days' })}</h3>
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                        </div>
                        {loading ? (
                            <Skeleton className="h-20" />
                        ) : (
                            <div className="flex items-end gap-1 h-16">
                                {(stats?.upcoming ?? []).map((day, i) => {
                                    const maxCount = Math.max(...(stats?.upcoming ?? []).map(d => d.count), 1);
                                    const height = maxCount > 0 ? Math.max((day.count / maxCount) * 100, 4) : 4;
                                    const dayLabels = [t({ ko: '오늘', en: 'Today' }), t({ ko: '내일', en: 'Tmrw' }), t({ ko: '모레', en: 'Next' })];
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                            <div
                                                className="w-full rounded-sm bg-primary/30 transition-all"
                                                style={{ height: `${height}%`, minHeight: '4px' }}
                                                title={`${day.count}${t({ ko: '개', en: '' })}`}
                                            />
                                            <span className="text-[9px] text-muted-foreground">
                                                {i < 3 ? dayLabels[i] : `+${i}`}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>

                    {/* Recently added words */}
                    <Card className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium">{t({ ko: '최근 추가', en: 'Recently Added' })}</h3>
                            <Link href="/vocabulary" className="text-xs text-primary hover:underline">{t({ ko: '전체 보기', en: 'View all' })}</Link>
                        </div>
                        {loading ? (
                            <div className="space-y-2">
                                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
                            </div>
                        ) : stats?.recentWords.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-4">{t({ ko: '아직 단어가 없어요', en: 'No words yet' })}</p>
                        ) : (
                            <div className="space-y-1.5">
                                {stats!.recentWords.map(w => (
                                    <Link key={w.id} href={`/vocabulary/${w.id}`}>
                                        <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className="text-base font-medium korean"
                                                    lang="ko"
                                                    style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                                                >
                                                    {w.hangul}
                                                </span>
                                                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                                                    {w.notes}
                                                </span>
                                            </div>
                                            <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    {/* Heatmap */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium">{t({ ko: '복습 기록', en: 'Review History' })}</h3>
                            <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        </div>
                        {loading ? <Skeleton className="h-32" /> : <ReviewHeatmap data={stats?.heatmap ?? []} />}
                    </Card>

                    {/* Study tips when empty */}
                    {!loading && (stats?.totalWords ?? 0) === 0 && (
                        <Card className="p-8 text-center border-dashed">
                            <Zap className="w-10 h-10 text-primary/40 mx-auto mb-3" />
                            <h3 className="font-semibold text-foreground mb-2">{t({ ko: 'Quiko에 오신 것을 환영합니다!', en: 'Welcome to Quiko!' })}</h3>
                            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                                {t({ ko: '첫 단어나 Grammar pattern을 추가하면 FSRS-5 복습 일정이 자동으로 생성됩니다.', en: 'FSRS-5 review schedules will be generated automatically as you add vocabulary or grammar patterns.' })}
                            </p>
                            <div className="flex gap-3 justify-center flex-wrap">
                                <Link href="/vocabulary">
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <BookOpen className="w-4 h-4" />
                                        {t({ ko: '단어 추가', en: 'Add Word' })}
                                    </Button>
                                </Link>
                                <Link href="/grammar">
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Layers className="w-4 h-4" />
                                        {t({ ko: '문법 보기', en: 'View Grammar' })}
                                    </Button>
                                </Link>
                                <Link href="/sentences">
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <AlignLeft className="w-4 h-4" />
                                        {t({ ko: '문장 추가', en: 'Add Sentence' })}
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    )}

                    {/* Quick add buttons */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { icon: BookOpen, label: t({ ko: '단어 추가', en: 'Add Word' }), href: '/vocabulary', desc: t({ ko: 'Vocabulary', en: 'Vocabulary' }) },
                            { icon: AlignLeft, label: t({ ko: '문장 추가', en: 'Add Sentence' }), href: '/sentences', desc: t({ ko: 'Sentences', en: 'Sentences' }) },
                            { icon: Layers, label: t({ ko: '문법 보기', en: 'View Grammar' }), href: '/grammar', desc: t({ ko: 'Grammar', en: 'Grammar' }) },
                        ].map(({ icon: Icon, label, href, desc }) => (
                            <Link key={href} href={href}>
                                <Card className="p-4 text-center hover:border-primary/30 transition-all cursor-pointer group h-full">
                                    <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary mx-auto mb-2 transition-colors" />
                                    <p
                                        className="text-sm font-medium"
                                        lang={lang}
                                        style={{ fontFamily: lang === 'ko' ? 'var(--font-noto-kr), Noto Sans KR, sans-serif' : 'inherit' }}
                                    >
                                        {label}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
