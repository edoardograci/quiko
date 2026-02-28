import { db } from './db';
import { settings } from './db/schema';

/**
 * Initialize the database with required tables via SQL.
 * This is called on first server startup.
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'quiko.db');

export function initializeDatabase() {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    const rawDb = new Database(DB_PATH);
    rawDb.pragma('journal_mode = WAL');
    rawDb.pragma('foreign_keys = ON');

    rawDb.exec(`
    CREATE TABLE IF NOT EXISTS sentences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      korean TEXT NOT NULL,
      literal_translation TEXT,
      natural_translation TEXT NOT NULL,
      audio_url TEXT,
      source TEXT,
      level TEXT,
      notes TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hangul TEXT NOT NULL UNIQUE,
      hanja TEXT,
      pronunciation TEXT,
      audio_url TEXT,
      pos TEXT,
      level TEXT,
      frequency_rank INTEGER,
      stem TEXT,
      irregular_type TEXT,
      honorific_plain TEXT,
      notes TEXT,
      tags TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS word_definitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
      definition_ko TEXT,
      definition_en TEXT,
      order_num INTEGER,
      krdict_target_code TEXT
    );

    CREATE TABLE IF NOT EXISTS word_examples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
      example_ko TEXT,
      example_en TEXT,
      source TEXT
    );

    CREATE TABLE IF NOT EXISTS sentence_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sentence_id INTEGER NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
      word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
      position INTEGER,
      surface_form TEXT,
      morpheme_breakdown TEXT,
      grammatical_role TEXT,
      particle_attached TEXT
    );

    CREATE TABLE IF NOT EXISTS grammar_patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pattern TEXT NOT NULL UNIQUE,
      name_ko TEXT,
      name_en TEXT NOT NULL,
      description TEXT NOT NULL,
      level TEXT,
      category TEXT,
      formality TEXT,
      example_pattern_use TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS sentence_grammar_patterns (
      sentence_id INTEGER NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
      grammar_pattern_id INTEGER NOT NULL REFERENCES grammar_patterns(id) ON DELETE CASCADE,
      PRIMARY KEY (sentence_id, grammar_pattern_id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_type TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      review_mode TEXT NOT NULL,
      due INTEGER NOT NULL,
      stability REAL NOT NULL DEFAULT 0,
      difficulty REAL NOT NULL DEFAULT 0,
      elapsed_days INTEGER NOT NULL DEFAULT 0,
      scheduled_days INTEGER NOT NULL DEFAULT 0,
      reps INTEGER NOT NULL DEFAULT 0,
      lapses INTEGER NOT NULL DEFAULT 0,
      state INTEGER NOT NULL DEFAULT 0,
      last_review INTEGER,
      UNIQUE(item_type, item_id, review_mode)
    );

    CREATE TABLE IF NOT EXISTS review_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL,
      user_answer TEXT,
      was_correct INTEGER,
      time_spent_ms INTEGER,
      reviewed_at INTEGER NOT NULL DEFAULT (unixepoch()),
      session_id TEXT,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS krdict_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL UNIQUE,
      response_xml TEXT NOT NULL,
      cached_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

    // Seed default settings
    const defaultSettings = [
        ['krdict_api_key', ''],
        ['daily_review_limit', '50'],
        ['new_cards_per_day', '10'],
        ['target_retention', '0.90'],
        ['theme', 'system'],
        ['show_pronunciation', 'true'],
        ['use_onscreen_keyboard', 'auto'],
    ];

    const settingsStmt = rawDb.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    for (const [key, value] of defaultSettings) {
        settingsStmt.run(key, value);
    }

    rawDb.close();
}
