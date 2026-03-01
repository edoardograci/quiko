import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { goals } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface RouteParams {
    params: { id: string };
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const goalId = parseInt(params.id, 10);
        const body = await req.json();
        const { target, period } = body;

        const goal = db.select().from(goals).where(eq(goals.id, goalId)).get();
        if (!goal) {
            return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
        }

        const updates: Record<string, any> = {};
        if (target !== undefined) updates.target = target;
        if (period !== undefined) updates.period = period;

        db.update(goals).set(updates).where(eq(goals.id, goalId)).run();

        const updated = db.select().from(goals).where(eq(goals.id, goalId)).get();
        return NextResponse.json({
            id: updated!.id,
            type: updated!.type,
            target: updated!.target,
            period: updated!.period,
            created_at: updated!.created_at,
        });
    } catch (error) {
        console.error('Goal update error:', error);
        return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const goalId = parseInt(params.id, 10);
        const goal = db.select().from(goals).where(eq(goals.id, goalId)).get();

        if (!goal) {
            return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
        }

        // Deactivate instead of hard delete
        db.update(goals).set({ active: 0 }).where(eq(goals.id, goalId)).run();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Goal delete error:', error);
        return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
    }
}
