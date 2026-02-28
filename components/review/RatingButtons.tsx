'use client';

import { cn } from '@/lib/utils';
import { RATING_LABELS, getIntervalLabel } from '@/lib/fsrs';
import { Rating } from 'ts-fsrs';
import { useLang } from '@/lib/i18n';

interface RatingButtonsProps {
    onRate: (rating: Rating) => void;
    previews?: Record<number, { interval: number; label: { ko: string, en: string } }>;
    disabled?: boolean;
}

const BUTTON_STYLES = {
    [Rating.Again]: 'rating-again',
    [Rating.Hard]: 'rating-hard',
    [Rating.Good]: 'rating-good',
    [Rating.Easy]: 'rating-easy',
};

export function RatingButtons({ onRate, previews, disabled }: RatingButtonsProps) {
    const { lang } = useLang();
    const ratings = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy];

    return (
        <div className="grid grid-cols-4 gap-2 w-full">
            {ratings.map((rating) => {
                const label = RATING_LABELS[rating as keyof typeof RATING_LABELS];
                const preview = previews?.[rating];
                return (
                    <button
                        key={rating}
                        onClick={() => !disabled && onRate(rating)}
                        disabled={disabled}
                        className={cn(
                            'flex flex-col items-center gap-1 px-3 py-3 rounded-xl border',
                            'font-medium transition-all duration-150',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            'active:scale-95',
                            BUTTON_STYLES[rating as keyof typeof BUTTON_STYLES]
                        )}
                    >
                        <span
                            className="text-base font-semibold"
                            lang={lang}
                            style={{ fontFamily: lang === 'ko' ? 'var(--font-noto-kr), Noto Sans KR, sans-serif' : 'inherit' }}
                        >
                            {label[lang === 'ko' ? 'ko' : 'en']}
                        </span>
                        {preview && (
                            <span className="text-[10px] opacity-70 font-normal">
                                {preview.label[lang === 'ko' ? 'ko' : 'en']}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
