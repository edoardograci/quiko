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
    Calendar, ChevronRight, Flame, Headphones, Settings2
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ReviewHeatmap } from '@/components/charts/ReviewHeatmap';
import { RetentionChart } from '@/components/charts/RetentionChart';
import { StreakAndHeatmap } from '@/components/charts/StreakAndHeatmap';
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
                const [dueRes, statsRes] = await Promise.all([
                    fetch('/api/review/due?count_only=false&limit=100'),
                    fetch('/api/review/stats'),
                ]);

                const due = await dueRes.json();
                const reviewStats = await statsRes.json();

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
                    totalWords: sent.total ?? 0,
                    totalSentences: sent.total ?? 0,
                    totalGrammar: gram.total ?? 0,
                    accuracy7d: reviewStats.accuracy_7d ?? 0,
                    heatmap: reviewStats.heatmap ?? [],
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
            {/* Header with Language Toggle */}
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">{t({ ko: '오늘의 학습', en: "Today's Study" })}</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {new Date().toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                    </p>
                </div>
                
                {/* Desktop Language Toggle */}
                <div className="hidden md:flex bg-muted rounded-md p-0.5 text-[10px] shadow-sm">
                    <button
                        onClick={() => useLang().setLang('en')}
                        className={cn('px-2.5 py-1 rounded-sm transition-colors', lang === 'en' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground')}
                    >
                        EN
                    </button>
                    <button
                        onClick={() => useLang().setLang('ko')}
                        className={cn('px-2.5 py-1 rounded-sm transition-colors', lang === 'ko' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground')}
                    >
                        KO
                    </button>
                </div>

                {/* Mobile Settings Icon */}
                <Link href="/settings" className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors">
                    <Settings2 className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                </Link>
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
                </div>

                <div className="lg:col-span-2 space-y-6">
                    {/* Streak + Heatmap Component */}
                    {loading ? (
                        <Card className="p-6">
                            <Skeleton className="h-64" />
                        </Card>
                    ) : (
                        <StreakAndHeatmap
                            streakDays={stats?.streakDays ?? 0}
                            reviewedToday={stats?.reviewedToday ?? 0}
                            dailyGoal={stats?.dailyGoal ?? 20}
                            heatmapData={stats?.heatmap ?? []}
                        />
                    )}

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
