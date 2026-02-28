import { FSRS, Rating, State, createEmptyCard, type Card } from 'ts-fsrs';

export { Rating, State };

export const scheduler = new FSRS({
    request_retention: 0.9,
    maximum_interval: 730,
    enable_fuzz: true,
});

export const RATING_LABELS = {
    [Rating.Again]: { ko: '다시', en: 'Again', color: 'red' },
    [Rating.Hard]: { ko: '어려워', en: 'Hard', color: 'orange' },
    [Rating.Good]: { ko: '잘 알아', en: 'Good', color: 'green' },
    [Rating.Easy]: { ko: '쉬워', en: 'Easy', color: 'blue' },
} as const;

export const STATE_LABELS = {
    [State.New]: { ko: '새 단어', en: 'New', color: 'gray' },
    [State.Learning]: { ko: '학습 중', en: 'Learning', color: 'amber' },
    [State.Review]: { ko: '복습', en: 'Review', color: 'green' },
    [State.Relearning]: { ko: '재학습', en: 'Relearning', color: 'orange' },
} as const;

export function processReview(card: Card, rating: Rating) {
    const now = new Date();
    const result = scheduler.next(card, now, rating);
    return {
        card: result.card,
        log: result.log,
    };
}

export function createReviewCard(itemType: string, itemId: number, mode: string) {
    const card = createEmptyCard(new Date());
    return {
        item_type: itemType,
        item_id: itemId,
        review_mode: mode,
        due: Math.floor(card.due.getTime() / 1000),
        stability: card.stability,
        difficulty: card.difficulty,
        elapsed_days: card.elapsed_days,
        scheduled_days: card.scheduled_days,
        reps: card.reps,
        lapses: card.lapses,
        state: card.state,
        last_review: null as number | null,
    };
}

export function dbReviewToCard(review: {
    due: number;
    stability: number;
    difficulty: number;
    elapsed_days: number;
    scheduled_days: number;
    reps: number;
    lapses: number;
    state: number;
    last_review: number | null;
}): Card {
    return {
        due: new Date(review.due * 1000),
        stability: review.stability,
        difficulty: review.difficulty,
        elapsed_days: review.elapsed_days,
        scheduled_days: review.scheduled_days,
        reps: review.reps,
        lapses: review.lapses,
        state: review.state as State,
        last_review: review.last_review ? new Date(review.last_review * 1000) : new Date(),
    };
}

export function getIntervalLabel(days: number): { ko: string, en: string } {
    if (days < 1) return { ko: '오늘', en: 'Today' };
    if (days === 1) return { ko: '내일', en: 'Tomorrow' };
    if (days < 7) return { ko: `${days}일 후`, en: `in ${days}d` };
    if (days < 30) return { ko: `${Math.round(days / 7)}주 후`, en: `in ${Math.round(days / 7)}w` };
    if (days < 365) return { ko: `${Math.round(days / 30)}달 후`, en: `in ${Math.round(days / 30)}mo` };
    return { ko: `${Math.round(days / 365)}년 후`, en: `in ${Math.round(days / 365)}y` };
}

export function previewRatings(card: Card) {
    const now = new Date();
    const results: Record<number, { interval: number; label: { ko: string, en: string } }> = {};
    for (const rating of [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy]) {
        const result = scheduler.next(card, now, rating);
        const days = result.card.scheduled_days;
        results[rating] = { interval: days, label: getIntervalLabel(days) };
    }
    return results;
}
