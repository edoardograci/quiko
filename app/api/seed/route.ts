import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings, grammarPatterns, words, reviews } from '@/lib/db/schema';
import { createReviewCard } from '@/lib/fsrs';
import fs from 'fs';
import path from 'path';

export async function POST() {
    try {
        const messages: string[] = [];

        // Seed default settings
        const defaultSettings = [
            { key: 'krdict_api_key', value: '' },
            { key: 'daily_review_limit', value: '50' },
            { key: 'new_cards_per_day', value: '10' },
            { key: 'target_retention', value: '0.90' },
            { key: 'theme', value: 'system' },
            { key: 'show_pronunciation', value: 'true' },
            { key: 'use_onscreen_keyboard', value: 'auto' },
            { key: 'daily_goal', value: '20' },
        ];
        for (const s of defaultSettings) {
            db.insert(settings).values(s).onConflictDoNothing().run();
        }
        messages.push('Settings initialized');

        // Seed grammar patterns
        const grammarSeedPath = path.join(process.cwd(), 'data', 'seed', 'grammar-patterns.json');
        if (fs.existsSync(grammarSeedPath)) {
            const patterns = JSON.parse(fs.readFileSync(grammarSeedPath, 'utf-8'));
            let grammarCount = 0;
            db.transaction((tx) => {
                for (const p of patterns) {
                    const result = tx.insert(grammarPatterns).values(p).onConflictDoNothing().run();
                    if (result.changes > 0 && result.lastInsertRowid) {
                        const patternId = Number(result.lastInsertRowid);
                        tx.insert(reviews).values(createReviewCard('grammar_pattern', patternId, 'recognition')).onConflictDoNothing().run();
                        grammarCount++;
                    }
                }
            });
            messages.push(`Grammar patterns: ${grammarCount} new (${patterns.length} total)`);
        }

        // Seed TOPIK I vocab
        const topik1Path = path.join(process.cwd(), 'data', 'seed', 'topik1-vocab.json');
        if (fs.existsSync(topik1Path)) {
            const vocab = JSON.parse(fs.readFileSync(topik1Path, 'utf-8'));
            let count = 0;
            db.transaction((tx) => {
                for (const w of vocab) {
                    const result = tx.insert(words)
                        .values({ hangul: w.hangul, pos: w.pos || 'noun', level: 'TOPIK-I', notes: w.english })
                        .onConflictDoUpdate({ target: words.hangul, set: { level: 'TOPIK-I' } })
                        .run();
                    if (result.changes > 0 && result.lastInsertRowid) {
                        const wordId = Number(result.lastInsertRowid);
                        tx.insert(reviews).values(createReviewCard('word', wordId, 'recognition')).onConflictDoNothing().run();
                        tx.insert(reviews).values(createReviewCard('word', wordId, 'production')).onConflictDoNothing().run();
                        count++;
                    }
                }
            });
            messages.push(`TOPIK I vocab: ${count} words`);
        }

        // Seed TOPIK II vocab
        const topik2Path = path.join(process.cwd(), 'data', 'seed', 'topik2-vocab.json');
        if (fs.existsSync(topik2Path)) {
            const vocab = JSON.parse(fs.readFileSync(topik2Path, 'utf-8'));
            let count = 0;
            db.transaction((tx) => {
                for (const w of vocab) {
                    const result = tx.insert(words)
                        .values({ hangul: w.hangul, pos: w.pos || 'noun', level: 'TOPIK-II', notes: w.english })
                        .onConflictDoUpdate({ target: words.hangul, set: { level: 'TOPIK-II' } })
                        .run();
                    if (result.changes > 0 && result.lastInsertRowid) {
                        const wordId = Number(result.lastInsertRowid);
                        tx.insert(reviews).values(createReviewCard('word', wordId, 'recognition')).onConflictDoNothing().run();
                        tx.insert(reviews).values(createReviewCard('word', wordId, 'production')).onConflictDoNothing().run();
                        count++;
                    }
                }
            });
            messages.push(`TOPIK II vocab: ${count} words`);
        }

        // Seed NIKL frequency list
        const niklPath = path.join(process.cwd(), 'data', 'seed', 'nikl-frequency.json');
        if (fs.existsSync(niklPath)) {
            const vocab = JSON.parse(fs.readFileSync(niklPath, 'utf-8'));
            let count = 0;
            // Since this is big, let's wrap in a transaction for speed
            db.transaction((tx) => {
                for (const w of vocab) {
                    const levelMap: Record<string, string> = { 'A': 'TOPIK-I', 'B': 'TOPIK-II', 'C': 'Advanced' };
                    const level = levelMap[w.level] || 'Unknown';
                    const result = tx.insert(words)
                        .values({ hangul: w.hangul, pos: w.pos || 'noun', level: level, frequency_rank: w.frequency_rank })
                        .onConflictDoUpdate({ target: words.hangul, set: { frequency_rank: w.frequency_rank } })
                        .run();

                    if (result.changes > 0 && result.lastInsertRowid) {
                        const wordId = Number(result.lastInsertRowid);
                        tx.insert(reviews).values(createReviewCard('word', wordId, 'recognition')).onConflictDoNothing().run();
                        tx.insert(reviews).values(createReviewCard('word', wordId, 'production')).onConflictDoNothing().run();
                        count++;
                    }
                }
            });
            messages.push(`NIKL Frequency: ${count} new words`);
        }

        return NextResponse.json({ success: true, message: messages.join(' · ') });
    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
