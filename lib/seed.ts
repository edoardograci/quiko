import { db } from './db';
import { settings, grammarPatterns, words, reviews } from './db/schema';
import { createReviewCard } from './fsrs';
import fs from 'fs';
import path from 'path';

async function seed() {
    console.log('🌱 Seeding Quiko database...');

    // Seed settings
    const defaultSettings = [
        { key: 'daily_review_limit', value: '50' },
        { key: 'new_cards_per_day', value: '10' },
        { key: 'target_retention', value: '0.90' },
        { key: 'theme', value: 'system' },
        { key: 'show_pronunciation', value: 'true' },
        { key: 'use_onscreen_keyboard', value: 'auto' },
    ];

    for (const s of defaultSettings) {
        db.insert(settings).values(s).onConflictDoNothing().run();
    }
    console.log('✅ Settings seeded');

    // Seed grammar patterns
    const grammarSeedPath = path.join(process.cwd(), 'data', 'seed', 'grammar-patterns.json');
    if (fs.existsSync(grammarSeedPath)) {
        const patterns = JSON.parse(fs.readFileSync(grammarSeedPath, 'utf-8'));
        for (const p of patterns) {
            db.insert(grammarPatterns).values(p).onConflictDoNothing().run();
        }
        console.log(`✅ Grammar patterns seeded (${patterns.length})`);
    } else {
        console.log('⚠️ grammar-patterns.json not found, skipping');
    }

    // Seed TOPIK I vocab
    const topik1Path = path.join(process.cwd(), 'data', 'seed', 'topik1-vocab.json');
    if (fs.existsSync(topik1Path)) {
        const vocab = JSON.parse(fs.readFileSync(topik1Path, 'utf-8'));
        let count = 0;
        for (const w of vocab) {
            const result = db.insert(words)
                .values({ hangul: w.hangul, pos: w.pos || 'noun', level: 'TOPIK-I', notes: w.english })
                .onConflictDoUpdate({ target: words.hangul, set: { level: 'TOPIK-I' } })
                .run();
            if (result.changes > 0) {
                // Create review cards for new words
                const wordId = result.lastInsertRowid as number;
                db.insert(reviews).values(createReviewCard('word', wordId, 'recognition')).onConflictDoNothing().run();
                db.insert(reviews).values(createReviewCard('word', wordId, 'production')).onConflictDoNothing().run();
                count++;
            }
        }
        console.log(`✅ TOPIK I vocab seeded (${count} new words)`);
    }

    // Seed TOPIK II vocab
    const topik2Path = path.join(process.cwd(), 'data', 'seed', 'topik2-vocab.json');
    if (fs.existsSync(topik2Path)) {
        const vocab = JSON.parse(fs.readFileSync(topik2Path, 'utf-8'));
        let count = 0;
        for (const w of vocab) {
            const result = db.insert(words)
                .values({ hangul: w.hangul, pos: w.pos || 'noun', level: 'TOPIK-II', notes: w.english })
                .onConflictDoUpdate({ target: words.hangul, set: { level: 'TOPIK-II' } })
                .run();
            if (result.changes > 0) {
                const wordId = result.lastInsertRowid as number;
                db.insert(reviews).values(createReviewCard('word', wordId, 'recognition')).onConflictDoNothing().run();
                db.insert(reviews).values(createReviewCard('word', wordId, 'production')).onConflictDoNothing().run();
                count++;
            }
        }
        console.log(`✅ TOPIK II vocab seeded (${count} new words)`);
    }

    console.log('🎉 Seeding complete!');
}

seed().catch(console.error);
