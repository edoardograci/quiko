import { startOfDay, differenceInDays } from 'date-fns';

export function calculateStreak(logs: { reviewed_at: number }[]): number {
    if (!logs || logs.length === 0) return 0;

    // Convert reviewed_at (seconds) to Date objects and get start of day
    const dates = logs
        .map(log => startOfDay(new Date(log.reviewed_at * 1000)).getTime())

    // Sort descending and get unique days
    const uniqueDays = Array.from(new Set(dates)).sort((a, b) => b - a);

    if (uniqueDays.length === 0) return 0;

    const today = startOfDay(new Date()).getTime();
    const mostRecentDay = uniqueDays[0];

    // If the most recent review wasn't today or yesterday, streak is broken
    const daysSinceLastReview = Math.floor((today - mostRecentDay) / (1000 * 60 * 60 * 24));
    if (daysSinceLastReview > 1) return 0;

    let streak = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
        const diff = Math.floor((uniqueDays[i - 1] - uniqueDays[i]) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}
