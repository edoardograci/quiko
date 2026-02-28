'use client';

import Link from 'next/link';
import { CheckCircle2, Clock, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Rating } from 'ts-fsrs';
import { useLang } from '@/lib/i18n';

interface SessionSummaryProps {
    results: {
        total: number;
        again: number;
        hard: number;
        good: number;
        easy: number;
        timeMs: number;
        nextDueTomorrow: number;
    };
}

export function SessionSummary({ results }: SessionSummaryProps) {
    const { lang, t } = useLang();
    const { total, again, hard, good, easy, timeMs, nextDueTomorrow } = results;
    const correct = good + easy;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const avgTime = total > 0 ? Math.round(timeMs / total / 1000) : 0;

    return (
        <div className="flex flex-col items-center gap-8 max-w-lg mx-auto py-12 animate-fade-in">
            {/* Header */}
            <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h2
                    className="text-2xl font-semibold"
                    lang={lang}
                    style={{ fontFamily: lang === 'ko' ? 'var(--font-noto-kr), Noto Sans KR, sans-serif' : 'inherit' }}
                >
                    {t({ ko: '복습 완료!', en: 'Review Complete!' })}
                </h2>
                <p className="text-muted-foreground mt-1">Session complete</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4 w-full">
                <Card className="p-4 text-center">
                    <p className="text-3xl font-bold text-foreground">{total}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t({ ko: '카드 검토', en: 'Cards Reviewed' })}</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-3xl font-bold text-primary">{accuracy}%</p>
                    <p className="text-xs text-muted-foreground mt-1">{t({ ko: '정확도', en: 'Accuracy' })}</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-3xl font-bold text-foreground">{avgTime}s</p>
                    <p className="text-xs text-muted-foreground mt-1">{t({ ko: '카드당 평균', en: 'Avg(s) per card' })}</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-3xl font-bold text-amber-500">{nextDueTomorrow}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t({ ko: '내일 예정', en: 'Due tomorrow' })}</p>
                </Card>
            </div>

            {/* Rating breakdown */}
            <div className="w-full bg-muted/50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">{t({ ko: '평가 내역', en: 'Rating History' })}</p>
                {([
                    { label: t({ ko: '다시', en: 'Again' }), count: again, color: 'bg-red-400' },
                    { label: t({ ko: '어려워', en: 'Hard' }), count: hard, color: 'bg-orange-400' },
                    { label: t({ ko: '잘 알아', en: 'Good' }), count: good, color: 'bg-green-400' },
                    { label: t({ ko: '쉬워', en: 'Easy' }), count: easy, color: 'bg-blue-400' },
                ] as const).map(({ label, count, color }) => (
                    <div key={label} className="flex items-center gap-3">
                        <span
                            className="w-12 text-xs text-right text-muted-foreground"
                            lang={lang}
                            style={{ fontFamily: lang === 'ko' ? 'var(--font-noto-kr), Noto Sans KR, sans-serif' : 'inherit' }}
                        >
                            {label}
                        </span>
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-full rounded-full ${color} transition-all duration-700`}
                                style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                            />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground w-6">{count}</span>
                    </div>
                ))}
            </div>

            {/* CTAs */}
            <div className="flex gap-3 w-full">
                <Link href="/dashboard" className="flex-1">
                    <Button variant="outline" className="w-full">{t({ ko: '홈으로', en: 'Home' })}</Button>
                </Link>
                <Link href="/review" className="flex-1">
                    <Button className="w-full bg-primary hover:bg-primary/90">{t({ ko: '새 세션', en: 'New Session' })}</Button>
                </Link>
            </div>
        </div>
    );
}
