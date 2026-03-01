import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { goals, reviewLogs, reviews } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
    try {
        const activeGoals = db.select().from(goals).where(eq(goals.active, 1)).all();

        const result = activeGoals.map((goal) => {
            let progress = 0;
            const now = Math.floor(Date.now() / 1000);

            if (goal.period === 'week') {
                const weekAgo = now - (7 * 24 * 60 * 60);
                if (goal.type === 'reviews_completed') {
                    const logsThisWeek = db.select().from(reviewLogs).where(and(eq(reviewLogs.reviewed_at, -1))).all();
                    progress = logsThisWeek.filter(l => l.reviewed_at >= weekAgo && l.reviewed_at <= now).length;
                } else if (goal.type === 'words_learned') {
                    const allReviews = db.select().from(reviews).where(eq(reviews.item_type, 'word')).all();
                    const allLogs = db.select().from(reviewLogs).all();
                    
                    const wordIds = new Set<number>();
                    for (const log of allLogs) {
                        if (log.reviewed_at >= weekAgo && log.reviewed_at <= now) {
                            const review = allReviews.find(r => r.id === log.review_id);
                            if (review && review.reps === 1) {
                                wordIds.add(review.item_id);
                            }
                        }
                    }
                    progress = wordIds.size;
                }
            } else if (goal.period === 'month') {
                const monthAgo = now - (30 * 24 * 60 * 60);
                if (goal.type === 'reviews_completed') {
                    const logsThisMonth = db.select().from(reviewLogs).all();
                    progress = logsThisMonth.filter(l => l.reviewed_at >= monthAgo && l.reviewed_at <= now).length;
                } else if (goal.type === 'words_learned') {
                    const allReviews = db.select().from(reviews).where(eq(reviews.item_type, 'word')).all();
                    const allLogs = db.select().from(reviewLogs).all();

                    const wordIds = new Set<number>();
                    for (const log of allLogs) {
                        if (log.reviewed_at >= monthAgo && log.reviewed_at <= now) {
                            const review = allReviews.find(r => r.id === log.review_id);
                            if (review && review.reps === 1) {
                                wordIds.add(review.item_id);
                            }
                        }
                    }
                    progress = wordIds.size;
                }
            }

            return {
                id: goal.id,
                type: goal.type,
                target: goal.target,
                period: goal.period,
                progress: Math.min(progress, goal.target),
                created_at: goal.created_at,
            };
        });

        return NextResponse.json({ goals: result });
    } catch (error) {
        console.error('Goals fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type, target, period } = body;

        if (!type || !target || !period) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        db.transaction((tx) => {
            // Deactivate existing goal of same type+period
            tx.update(goals).set({ active: 0 }).where(
                and(eq(goals.type, type), eq(goals.period, period), eq(goals.active, 1))
            ).run();

            // Insert new goal
            tx.insert(goals).values({
                type,
                target,
                period,
                created_at: Math.floor(Date.now() / 1000),
                active: 1,
            }).run();
        });

        const newGoal = db.select().from(goals).where(eq(goals.active, 1)).orderBy(goals.created_at).all().pop();

        if (!newGoal) {
            return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
        }

        return NextResponse.json({
            id: newGoal.id,
            type: newGoal.type,
            target: newGoal.target,
            period: newGoal.period,
            progress: 0,
            created_at: newGoal.created_at,
        });
    } catch (error) {
        console.error('Goal creation error:', error);
        return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
    }
}
