import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import Database from 'better-sqlite3';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { eq, and } from 'drizzle-orm';

import { db } from '@/lib/db';
import { words, wordDefinitions, reviews, decks, deckSettings, reviewDeckAssignments } from '@/lib/db/schema';
import { createReviewCard } from '@/lib/fsrs';

interface ParsedCard {
    hangul: string;
    definition: string;
    rawBack: string;
}

interface ParsedResult {
    totalNotes: number;
    cards: ParsedCard[];
}

function cleanHtml(value: string): string {
    let result = value.replace(/<[^>]+>/g, ' ');
    result = result.replace(/&nbsp;/gi, ' ');
    result = result
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, '\'');
    return result.replace(/\s+/g, ' ').trim();
}

async function parseApkgFile(file: Blob): Promise<ParsedResult> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const zip = await JSZip.loadAsync(buffer);
    const collectionFile =
        zip.file('collection.anki21') ??
        zip.file('collection.anki2');

    if (!collectionFile) {
        throw new Error('Not a valid .apkg file (no collection.anki21 or collection.anki2 found)');
    }

    const tempPath = path.join(
        os.tmpdir(),
        `quiko-anki-import-${Date.now()}-${Math.random().toString(16).slice(2)}.db`,
    );

    const fileBuffer = await collectionFile.async('nodebuffer');
    fs.writeFileSync(tempPath, fileBuffer);

    const koreanRegex = /[가-힣ㄱ-ㅎㅏ-ㅣ]/;

    let tempDb: Database.Database | null = null;
    try {
        tempDb = new Database(tempPath, { readonly: true });

        const stmt = tempDb.prepare('SELECT id, flds FROM notes');
        const rows = stmt.all() as { id: number; flds: string }[];

        const cards: ParsedCard[] = [];
        const totalNotes = rows.length;

        for (const row of rows) {
            const rawFields = row.flds ?? '';
            if (!rawFields) continue;

            let fields = rawFields.split('\x1f');
            if (fields.length < 2) {
                fields = rawFields.split('\t');
            }
            if (fields.length < 2) continue;

            const frontRaw = cleanHtml(fields[0] ?? '');
            const backRaw = (fields[1] ?? '').trim();
            const backClean = cleanHtml(fields[1] ?? '');

            if (!frontRaw) continue;
            if (!koreanRegex.test(frontRaw)) continue;

            cards.push({
                hangul: frontRaw,
                definition: backClean,
                rawBack: backRaw,
            });
        }

        return { totalNotes, cards };
    } finally {
        if (tempDb) {
            tempDb.close();
        }
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
    }
}

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const confirm = searchParams.get('confirm') === 'true';

    try {
        const formData = await req.formData();
        const file = formData.get('file');
        const deckName = formData.get('name') as string | null;

        if (!file || !(file instanceof Blob)) {
            return NextResponse.json(
                { error: 'Missing .apkg file in `file` field' },
                { status: 400 },
            );
        }

        // Extract filename without extension for default deck name
        const fileName = (file as any).name || 'imported_deck';
        const defaultDeckName = fileName.replace(/\.apkg$/i, '');
        const finalDeckName = deckName || defaultDeckName;

        const { totalNotes, cards } = await parseApkgFile(file);
        const totalKorean = cards.length;

        if (!confirm) {
            return NextResponse.json({
                total: totalNotes,
                korean_cards: totalKorean,
                deck_name: finalDeckName,
                preview: cards.slice(0, 10).map((c) => ({
                    hangul: c.hangul,
                    definition: c.definition,
                })),
            });
        }

        let imported = 0;
        let skipped = 0;
        let deckId = 0;

        db.transaction((tx) => {
            // Create deck record
            const deckResult = tx.insert(decks).values({
                name: finalDeckName,
                source: 'anki',
                created_at: Math.floor(Date.now() / 1000),
            }).run();
            deckId = Number(deckResult.lastInsertRowid);

            // Create deck settings
            tx.insert(deckSettings).values({
                deck_id: deckId,
                daily_review_limit: 50,
                new_cards_per_day: 10,
                target_retention: 0.9,
            }).run();

            for (const card of cards) {
                const truncatedNotes =
                    card.rawBack.length > 200
                        ? card.rawBack.slice(0, 200)
                        : card.rawBack;

                const insertResult = tx
                    .insert(words)
                    .values({
                        hangul: card.hangul,
                        pos: null,
                        level: 'custom',
                        notes: truncatedNotes,
                    })
                    .onConflictDoNothing()
                    .run();

                let wordId: number;
                if (insertResult.changes && insertResult.changes > 0) {
                    imported += 1;
                    wordId = Number(insertResult.lastInsertRowid);
                } else {
                    // Word already exists, fetch its ID
                    skipped += 1;
                    const existingWord = tx.select().from(words).where(eq(words.hangul, card.hangul)).get();
                    if (!existingWord) continue;
                    wordId = existingWord.id;
                }

                if (card.definition) {
                    tx.insert(wordDefinitions)
                        .values({
                            word_id: wordId,
                            definition_en: card.definition,
                            order_num: 1,
                            definition_ko: null,
                            krdict_target_code: null,
                        })
                        .onConflictDoNothing()
                        .run();
                }

                // Create or get review cards and assign to deck
                const recReviews = tx.select().from(reviews).where(and(eq(reviews.item_type, 'word'), eq(reviews.item_id, wordId))).all();
                
                if (recReviews.length === 0) {
                    // Create review cards for this word
                    const recResult1 = tx.insert(reviews).values(createReviewCard('word', wordId, 'recognition')).onConflictDoNothing().run();
                    if (recResult1.changes && recResult1.changes > 0) {
                        const reviewId = Number(recResult1.lastInsertRowid);
                        tx.insert(reviewDeckAssignments).values({ review_id: reviewId, deck_id: deckId }).onConflictDoNothing().run();
                    }

                    const prodResult = tx.insert(reviews).values(createReviewCard('word', wordId, 'production')).onConflictDoNothing().run();
                    if (prodResult.changes && prodResult.changes > 0) {
                        const reviewId = Number(prodResult.lastInsertRowid);
                        tx.insert(reviewDeckAssignments).values({ review_id: reviewId, deck_id: deckId }).onConflictDoNothing().run();
                    }
                } else {
                    // Word already has reviews, assign them to this deck
                    for (const review of recReviews) {
                        tx.insert(reviewDeckAssignments).values({ review_id: review.id, deck_id: deckId }).onConflictDoNothing().run();
                    }
                }
            }
        });

        return NextResponse.json({
            imported,
            skipped,
            total: totalKorean,
            deck_id: deckId,
            deck_name: finalDeckName,
        });
    } catch (error) {
        console.error('Anki import error:', error);
        return NextResponse.json(
            { error: 'Failed to import Anki deck' },
            { status: 500 },
        );
    }
}

