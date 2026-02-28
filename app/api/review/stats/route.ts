import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reviewLogs, reviews } from '@/lib/db/schema';
import { gte, sql, eq, and } from 'drizzle-orm';

export async function GET() {
    try {
        const now = Math.floor(Date.now() / 1000);
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
        const oneYearAgo = now - 365 * 24 * 60 * 60;

        // 7-day accuracy
        const sevenDaysAgo = now - 7 * 24 * 60 * 60;
        const recentLogs = db.select().from(reviewLogs).where(gte(reviewLogs.reviewed_at, sevenDaysAgo)).all();
        const accuracy7d = recentLogs.length > 0
            ? Math.round((recentLogs.filter(l => l.was_correct === 1).length / recentLogs.length) * 100)
            : 0;

        // Heatmap data (last 365 days) - group by day
        const heatmapLogs = db.select({
            day: sql<number>`cast(${reviewLogs.reviewed_at} / 86400 as integer)`,
            count: sql<number>`count(*)`,
        })
            .from(reviewLogs)
            .where(gte(reviewLogs.reviewed_at, oneYearAgo))
            .groupBy(sql`cast(${reviewLogs.reviewed_at} / 86400 as integer)`)
            .all();

        // Upcoming reviews (next 7 days)
        const upcoming = [];
        for (let i = 0; i < 7; i++) {
            const dayStart = now + i * 86400;
            const dayEnd = dayStart + 86400;
            const count = db.select({ count: sql<number>`count(*)` })
                .from(reviews)
                .where(and(gte(reviews.due, dayStart), sql`${reviews.due} < ${dayEnd}`))
                .get()?.count ?? 0;
            upcoming.push({ day: i, count });
        }

        // Total counts by state
        const stateCounts = db.select({
            state: reviews.state,
            count: sql<number>`count(*)`,
        })
            .from(reviews)
            .groupBy(reviews.state)
            .all();

        return NextResponse.json({
            accuracy_7d: accuracy7d,
            total_reviews: recentLogs.length,
            heatmap: heatmapLogs,
            upcoming_reviews: upcoming,
            state_counts: stateCounts,
        });
    } catch (error) {
        console.error('Stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
