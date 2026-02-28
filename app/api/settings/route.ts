import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        const allSettings = db.select().from(settings).all();
        const result: Record<string, string> = {};
        for (const s of allSettings) {
            result[s.key] = s.value ?? '';
        }
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        for (const [key, value] of Object.entries(body)) {
            db.insert(settings)
                .values({ key, value: String(value) })
                .onConflictDoUpdate({ target: settings.key, set: { value: String(value) } })
                .run();
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
