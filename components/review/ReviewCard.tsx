'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RatingButtons } from './RatingButtons';
import { Rating } from 'ts-fsrs';
import { previewRatings, dbReviewToCard } from '@/lib/fsrs';
import { cn } from '@/lib/utils';
import { Volume2, Eye } from 'lucide-react';
import { MorphemeBreakdown } from '@/components/vocabulary/MorphemeBreakdown';
import { Badge } from '@/components/ui/badge';
import { STATE_LABELS } from '@/lib/fsrs';
import { useLang } from '@/lib/i18n';

interface ReviewCardData {
    review_id: number;
    item_type: string;
    item_id: number;
    review_mode: string;
    word?: {
        id: number;
        hangul: string;
        pos?: string;
        level?: string;
        notes?: string;
        stem?: string;
        audio_url?: string;
    };
    pattern?: {
        id: number;
        pattern: string;
        name_en: string;
        description: string;
        example_pattern_use?: string;
        level?: string;
        category?: string;
    };
    definitions?: Array<{ definition_en?: string; definition_ko?: string; order_num?: number }>;
    examples?: Array<{ example_ko?: string; example_en?: string }>;
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
}

interface ReviewCardProps {
    card: ReviewCardData;
    onRate: (reviewId: number, rating: Rating, isCorrect: boolean) => void;
    sessionProgress: { current: number; total: number };
}

export function ReviewCard({ card, onRate, sessionProgress }: ReviewCardProps) {
    const { lang, t } = useLang();
    const [isFlipped, setIsFlipped] = useState(false);

    const fsrsCard = dbReviewToCard({
        ...card.fsrs,
        last_review: card.fsrs.last_review ?? null,
    });
    const previews = previewRatings(fsrsCard);

    const stateInfo = STATE_LABELS[card.fsrs.state as keyof typeof STATE_LABELS];

    const handleFlip = () => setIsFlipped(true);
    const handleRate = (rating: Rating) => {
        const isCorrect = rating >= Rating.Good;
        onRate(card.review_id, rating, isCorrect);
        setIsFlipped(false);
    };

    const progressPct = sessionProgress.total > 0
        ? (sessionProgress.current / sessionProgress.total) * 100
        : 0;

    const isWordCard = card.item_type === 'word' && card.word;
    const isGrammarCard = card.item_type === 'grammar_pattern' && card.pattern;

    return (
        <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
            {/* Progress bar */}
            <div className="flex items-center gap-3">
                <div className="review-progress flex-1">
                    <div className="review-progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {sessionProgress.current} / {sessionProgress.total}
                </span>
            </div>

            {/* Card */}
            <div className="card-flip-container">
                <div className={cn('card-flip-inner', isFlipped && 'flipped')}>
                    {/* Front */}
                    <motion.div
                        className="card-face"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="bg-card border border-border rounded-2xl shadow-lg p-8 md:p-12 min-h-[300px] flex flex-col justify-between">
                            {/* Top: mode + state badge */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                    {card.review_mode === 'recognition' ? t({ ko: '인식', en: 'Recognition' }) : card.review_mode === 'production' ? t({ ko: '생성', en: 'Production' }) : card.review_mode}
                                </span>
                                <Badge
                                    variant="outline"
                                    className={cn('text-[10px]', stateInfo?.color === 'gray' && 'opacity-50')}
                                >
                                    {stateInfo?.[lang === 'ko' ? 'ko' : 'en']}
                                </Badge>
                            </div>

                            {/* Main content */}
                            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8">
                                {isWordCard && (
                                    <>
                                        {card.review_mode === 'recognition' ? (
                                            // Show Korean → reveal English
                                            <div className="text-center">
                                                <h2
                                                    className="text-5xl md:text-6xl font-medium text-foreground korean"
                                                    lang="ko"
                                                    style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                                                >
                                                    {card.word!.hangul}
                                                </h2>
                                                {card.word!.pos && (
                                                    <p className="text-sm text-muted-foreground mt-3">{card.word!.pos}</p>
                                                )}
                                            </div>
                                        ) : (
                                            // Show English → type Korean
                                            <div className="text-center">
                                                <p className="text-lg text-muted-foreground mb-2">{t({ ko: '뜻을 보고 한국어로 쓰세요', en: 'Translate to Korean based on the definition' })}</p>
                                                <h2 className="text-3xl font-medium text-foreground">
                                                    {card.definitions?.[0]?.definition_en || card.word!.notes || '—'}
                                                </h2>
                                                {card.word!.pos && (
                                                    <p className="text-sm text-muted-foreground mt-2">({card.word!.pos})</p>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}

                                {isGrammarCard && (
                                    <div className="text-center">
                                        {card.review_mode === 'recognition' ? (
                                            <>
                                                <code className="text-3xl md:text-4xl font-mono text-primary font-semibold">
                                                    {card.pattern!.pattern}
                                                </code>
                                                {card.pattern!.category && (
                                                    <p className="text-sm text-muted-foreground mt-3">{card.pattern!.category}</p>
                                                )}
                                            </>
                                        ) : (
                                            <h2 className="text-2xl font-medium">{card.pattern!.name_en}</h2>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Show answer button */}
                            <button
                                onClick={handleFlip}
                                className="w-full py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <Eye className="w-4 h-4" />
                                <span lang={lang} style={{ fontFamily: lang === 'ko' ? 'var(--font-noto-kr), Noto Sans KR, sans-serif' : 'inherit' }}>{t({ ko: '정답 확인', en: 'Show Answer' })}</span>
                            </button>
                        </div>
                    </motion.div>

                    {/* Back (answer) */}
                    <div className="card-face card-back absolute inset-0">
                        <div className="bg-card border border-border rounded-2xl shadow-lg p-8 md:p-12 min-h-[300px] flex flex-col gap-6">
                            {isWordCard && (
                                <>
                                    <div className="text-center">
                                        <h2
                                            className="text-5xl font-medium text-foreground korean"
                                            lang="ko"
                                            style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                                        >
                                            {card.word!.hangul}
                                        </h2>
                                        {card.word!.notes && (
                                            <p className="text-lg text-muted-foreground mt-2">{card.word!.notes}</p>
                                        )}
                                    </div>

                                    {/* Definitions */}
                                    {card.definitions && card.definitions.length > 0 && (
                                        <div className="space-y-2">
                                            {card.definitions.slice(0, 3).map((def, i) => (
                                                <div key={i} className="flex gap-3">
                                                    <span className="text-xs text-muted-foreground font-mono pt-0.5">{i + 1}.</span>
                                                    <div>
                                                        {def.definition_en && <p className="text-sm font-medium">{def.definition_en}</p>}
                                                        {def.definition_ko && <p className="text-xs text-muted-foreground mt-0.5" lang="ko" style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}>{def.definition_ko}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Example */}
                                    {card.examples && card.examples.length > 0 && (
                                        <div className="bg-muted/50 rounded-lg p-3">
                                            <p className="text-sm korean" lang="ko" style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}>
                                                {card.examples[0].example_ko}
                                            </p>
                                            {card.examples[0].example_en && (
                                                <p className="text-xs text-muted-foreground mt-1">{card.examples[0].example_en}</p>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {isGrammarCard && (
                                <>
                                    <div className="text-center">
                                        <code className="text-2xl font-mono text-primary">{card.pattern!.pattern}</code>
                                        <h3 className="text-xl font-semibold mt-2">{card.pattern!.name_en}</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{card.pattern!.description}</p>
                                    {card.pattern!.example_pattern_use && (
                                        <div className="bg-muted/50 rounded-lg p-3">
                                            <p
                                                className="text-base korean"
                                                lang="ko"
                                                style={{ fontFamily: 'var(--font-noto-kr), Noto Sans KR, sans-serif' }}
                                            >
                                                {card.pattern!.example_pattern_use}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Rating buttons */}
                            {isFlipped && <RatingButtons onRate={handleRate} previews={previews} />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
