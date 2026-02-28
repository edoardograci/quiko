'use client';

import { useEffect, useState, useRef, use } from 'react';
import { ReviewCard } from '@/components/review/ReviewCard';
import { SessionSummary } from '@/components/review/SessionSummary';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Rating } from 'ts-fsrs';
import { v4 as uuidv4 } from 'uuid';

interface Props {
    params: Promise<{ mode: string }>;
}

type ReviewCardData = {
    review_id: number;
    item_type: string;
    item_id: number;
    review_mode: string;
    word?: unknown;
    pattern?: unknown;
    definitions?: unknown[];
    examples?: unknown[];
    fsrs: {
        state: number;
        stability: number;
        difficulty: number;
        elapsed_days: number;
        scheduled_days: number;
        reps: number;
        lapses: number;
        due: number;
        last_review?: number | null;
    };
};

type RatingCount = { again: number; hard: number; good: number; easy: number };

export default function ReviewSessionPage({ params }: Props) {
    const { mode } = use(params);
    const [cards, setCards] = useState<ReviewCardData[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [loading, setLoading] = useState(true);
    const [sessionDone, setSessionDone] = useState(false);
    const [ratingCounts, setRatingCounts] = useState<RatingCount>({ again: 0, hard: 0, good: 0, easy: 0 });
    const [totalTimeMs, setTotalTimeMs] = useState(0);
    const [nextDueTomorrow, setNextDueTomorrow] = useState(0);
    const sessionId = useRef(uuidv4());
    const cardStartTime = useRef(Date.now());

    // Map mode to API param
    const modeParam = mode === 'word' ? '?mode=word' : mode === 'grammar' ? '?mode=grammar' : '';

    useEffect(() => {
        async function fetchCards() {
            try {
                const res = await fetch(`/api/review/due${modeParam}`);
                const data = await res.json();
                setCards(data.cards ?? []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
                cardStartTime.current = Date.now();
            }
        }
        fetchCards();
    }, [modeParam]);

    const handleRate = async (reviewId: number, rating: Rating, isCorrect: boolean) => {
        const timeSpent = Date.now() - cardStartTime.current;
        setTotalTimeMs(t => t + timeSpent);

        // Update rating counts
        setRatingCounts(prev => {
            const next = { ...prev };
            if (rating === Rating.Again) next.again++;
            else if (rating === Rating.Hard) next.hard++;
            else if (rating === Rating.Good) next.good++;
            else if (rating === Rating.Easy) next.easy++;
            return next;
        });

        // Submit to API
        try {
            const res = await fetch('/api/review/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    review_id: reviewId,
                    rating,
                    was_correct: isCorrect,
                    time_spent_ms: timeSpent,
                    session_id: sessionId.current,
                }),
            });
            const data = await res.json();
            if (data.next_interval_days === 1) {
                setNextDueTomorrow(n => n + 1);
            }
        } catch (e) {
            console.error(e);
        }

        // Advance to next card
        cardStartTime.current = Date.now();
        if (currentIdx + 1 >= cards.length) {
            setSessionDone(true);
        } else {
            setCurrentIdx(i => i + 1);
        }
    };

    if (loading) {
        return (
            <div className="p-8 max-w-2xl mx-auto space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-72 w-full rounded-2xl" />
                <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
                </div>
            </div>
        );
    }

    if (cards.length === 0) {
        return (
            <div className="p-8 max-w-2xl mx-auto text-center py-16">
                <p className="text-xl font-semibold mb-2">오늘 복습할 카드가 없어요</p>
                <p className="text-muted-foreground text-sm mb-6">No cards due for this session.</p>
                <Link href="/review">
                    <Button variant="outline">← 복습 메뉴로</Button>
                </Link>
            </div>
        );
    }

    if (sessionDone) {
        return (
            <div className="p-6 md:p-8">
                <SessionSummary
                    results={{
                        total: cards.length,
                        ...ratingCounts,
                        timeMs: totalTimeMs,
                        nextDueTomorrow,
                    }}
                />
            </div>
        );
    }

    const currentCard = cards[currentIdx];

    return (
        <div className="p-4 md:p-8 min-h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <Link href="/review">
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                        <ArrowLeft className="w-4 h-4" />
                        <span>종료</span>
                    </Button>
                </Link>
                <span className="text-xs text-muted-foreground">
                    {mode === 'word' ? '단어 복습' : mode === 'grammar' ? '문법 복습' : '표준 복습'}
                </span>
            </div>

            {/* Review Card */}
            <div className="flex-1 flex items-start justify-center">
                <ReviewCard
                    key={currentCard.review_id}
                    card={currentCard as Parameters<typeof ReviewCard>[0]['card']}
                    onRate={handleRate}
                    sessionProgress={{ current: currentIdx, total: cards.length }}
                />
            </div>
        </div>
    );
}
