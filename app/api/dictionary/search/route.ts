import { NextRequest, NextResponse } from 'next/server';
import { searchKrdict } from '@/lib/krdict';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q) return NextResponse.json({ error: 'q parameter required' }, { status: 400 });

    try {
        const results = await searchKrdict(q);
        return NextResponse.json({ results, query: q });
    } catch (error) {
        console.error('Dictionary search error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
