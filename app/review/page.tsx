'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, BookOpen, Layers, ChevronRight, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLang } from '@/lib/i18n';

interface DueInfo {
    total: number;
    new: number;
    review: number;
}

interface Deck {
    id: number;
    name: string;
    source: string;
    due_count: number;
}

export default function ReviewEntryPage() {
    const { lang, t } = useLang();
    const [allDue, setAllDue] = useState<DueInfo | null>(null);
    const [wordDue, setWordDue] = useState<DueInfo | null>(null);
    const [grammarDue, setGrammarDue] = useState<DueInfo | null>(null);
    const [decks, setDecks] = useState<Deck[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDue() {
            try {
                const [all, words, grammar, decksRes] = await Promise.all([
                    fetch('/api/review/due').then(r => r.json()),
                    fetch('/api/review/due?mode=word').then(r => r.json()),
                    fetch('/api/review/due?mode=grammar').then(r => r.json()),
                    fetch('/api/decks').then(r => r.json()),
                ]);
                setAllDue(all);
                setWordDue(words);
                setGrammarDue(grammar);
                // Map decks to the format we need
                const deckData = (decksRes.decks || []).map((d: any) => ({
                    id: d.id,
                    name: d.name,
                    source: d.source,
                    due_count: d.due_count,
                }));
                setDecks(deckData);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchDue();
    }, []);

    const sessions = [
        {
            icon: Brain,
            label: t({ ko: '표준 복습', en: 'Standard Review' }),
            subtitle: t({ ko: 'Standard Review', en: 'Spaced Repetition' }),
            desc: t({ ko: '단어 + 문법 — 인식 및 생성 혼합', en: 'Vocab + Grammar — recognition & production blended' }),
            href: '/review/standard',
            data: allDue,
            color: 'text-primary',
            bg: 'bg-primary/5 border-primary/20',
        },
        {
            icon: BookOpen,
            label: t({ ko: '단어 복습', en: 'Vocabulary Only' }),
            subtitle: t({ ko: 'Vocabulary Only', en: 'Cards' }),
            desc: t({ ko: '단어 카드만 복습', en: 'Review vocabulary cards only' }),
            href: '/review/word',
            data: wordDue,
            color: 'text-blue-500',
            bg: 'bg-blue-500/5 border-blue-500/20',
        },
        {
            icon: Layers,
            label: t({ ko: '문법 복습', en: 'Grammar Only' }),
            subtitle: t({ ko: 'Grammar Only', en: 'Patterns' }),
            desc: t({ ko: '문법 패턴 카드만 복습', en: 'Review grammar pattern cards only' }),
            href: '/review/grammar',
            data: grammarDue,
            color: 'text-purple-500',
            bg: 'bg-purple-500/5 border-purple-500/20',
        },
    ];

    return (
        <div className="p-6 md:p-8 max-w-2xl mx-auto">
            <div className="mb-8">
                <h1
                    className="text-2xl font-semibold"
                    lang={lang}
                    style={{ fontFamily: lang === 'ko' ? 'var(--font-noto-kr), Noto Sans KR, sans-serif' : 'inherit' }}
                >
                    {t({ ko: '복습 세션', en: 'Review Session' })}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">{t({ ko: 'Review Session', en: 'Spaced Repetition' })}</p>
            </div>

            <div className="space-y-6">
                {sessions.map(({ icon: Icon, label, subtitle, desc, href, data, color, bg }) => (
                    <Link key={href} href={href}>
                        <Card className={`p-5 hover:shadow-md transition-all cursor-pointer border ${bg} group`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                                    <Icon className={`w-5 h-5 ${color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3
                                            className="font-semibold text-foreground"
                                            lang={lang}
                                            style={{ fontFamily: lang === 'ko' ? 'var(--font-noto-kr), Noto Sans KR, sans-serif' : 'inherit' }}
                                        >
                                            {label}
                                        </h3>
                                        <span className="text-xs text-muted-foreground">{subtitle}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                                    {loading ? (
                                        <Skeleton className="h-4 w-32 mt-2" />
                                    ) : (
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-xs font-medium">
                                                {t({ ko: '총', en: 'Total' })} <span className={color}>{data?.total ?? 0}</span>{t({ ko: '개', en: ' cards' })}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {t({ ko: '복습', en: 'Review' })} {data?.review ?? 0} · {t({ ko: '신규', en: 'New' })} {data?.new ?? 0}
                                            </span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-3 h-3" />~{Math.ceil((data?.total ?? 0) * 10 / 60)}{t({ ko: '분', en: 'm' })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                            </div>
                        </Card>
                    </Link>
                ))}

                {/* Decks section */}
                {!loading && decks.length > 0 && (
                    <>
                        <div className="mt-8 mb-4">
                            <h2 className="text-sm font-semibold text-muted-foreground">
                                {t({ ko: '임포트된 덱', en: 'Imported Decks' })}
                            </h2>
                        </div>
                        {decks.map((deck) => (
                            <Link key={deck.id} href={`/review/deck/${deck.id}`}>
                                <Card className="p-5 hover:shadow-md transition-all cursor-pointer border border-border/50 group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                            <BookOpen className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-foreground truncate">{deck.name}</h3>
                                                <Badge variant="secondary" className="text-xs shrink-0">{deck.source}</Badge>
                                            </div>
                                            {loading ? (
                                                <Skeleton className="h-4 w-32 mt-2" />
                                            ) : (
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-xs text-muted-foreground">
                                                        {t({ ko: '예정', en: 'Due' })} <span className="font-medium">{deck.due_count}</span>
                                                    </span>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />~{Math.ceil(deck.due_count * 10 / 60)}{t({ ko: '분', en: 'm' })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </>
                )}
            </div>

            {!loading && (allDue?.total ?? 0) === 0 && (
                <div className="mt-8 text-center py-12 border border-dashed border-border rounded-2xl">
                    <Brain className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="font-medium text-foreground">{t({ ko: '오늘 복습할 카드가 없어요', en: 'No cards due today' })}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t({ ko: '단어나 문법 패턴을 추가하여 복습을 시작하세요.', en: 'Add words or grammar patterns to start reviewing.' })}
                    </p>
                </div>
            )}
        </div>
    );
}
