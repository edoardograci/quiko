import { db } from './index';
import { settings } from './schema';

/**
 * Initialize the database with required tables via SQL.
 * This is called on first server startup.
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'quiko.db');
const INIT_LOCK_PATH = path.join(process.cwd(), 'data', '.init.lock');
let initialized = false;

function acquireLock() {
  const maxWait = 30000; // 30 seconds
  const start = Date.now();
  
  while (Date.now() - start < maxWait) {
    try {
      // Try to create the lock file exclusively
      const fd = fs.openSync(INIT_LOCK_PATH, fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_WRONLY);
      fs.closeSync(fd);
      return true;
    } catch {
      // Lock file exists, wait and retry
      const delay = 50 + Math.random() * 50;
      const waitStart = Date.now();
      while (Date.now() - waitStart < delay) {
        // Busy wait
      }
    }
  }
  return false;
}

function releaseLock() {
  try {
    fs.unlinkSync(INIT_LOCK_PATH);
  } catch {
    // Ignore if file doesn't exist
  }
}

export function initializeDatabase() {
  // Skip if already initialized in this process
  if (initialized) {
    return;
  }

  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Only one process should initialize at a time
  if (!acquireLock()) {
    console.warn('Failed to acquire initialization lock');
    return;
  }

  try {
    let retries = 0;
    const maxRetries = 5;
    let rawDb: Database.Database | null = null;

    while (retries < maxRetries && !rawDb) {
      try {
        rawDb = new Database(DB_PATH);
        rawDb.pragma('journal_mode = WAL');
        rawDb.pragma('foreign_keys = ON');
        rawDb.pragma('busy_timeout = 5000');
        break;
      } catch (error: any) {
        retries++;
        if (error.code === 'SQLITE_BUSY' && retries < maxRetries) {
          // Wait a bit before retrying
          const delay = 100 * Math.pow(2, retries - 1);
          const start = Date.now();
          while (Date.now() - start < delay) {
            // Busy wait
          }
        } else {
          throw error;
        }
      }
    }

    if (!rawDb) {
      throw new Error('Failed to initialize database after retries');
    }

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
    CREATE TABLE IF NOT EXISTS listening_episodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      series TEXT NOT NULL DEFAULT 'TTMIK',
      level TEXT,
      episode_number INTEGER,
      youtube_id TEXT,
      thumbnail_url TEXT,
      duration_seconds INTEGER,
      description TEXT,
      added_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE UNIQUE INDEX IF NOT EXISTS listening_episodes_youtube_id_unique 
    ON listening_episodes(youtube_id) WHERE youtube_id IS NOT NULL;

    CREATE TABLE IF NOT EXISTS listening_transcripts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      episode_id INTEGER NOT NULL REFERENCES listening_episodes(id) ON DELETE CASCADE,
      start_ms INTEGER NOT NULL,
      end_ms INTEGER NOT NULL,
      text TEXT NOT NULL,
      UNIQUE(episode_id, start_ms)
    );

    CREATE TABLE IF NOT EXISTS listening_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      episode_id INTEGER NOT NULL REFERENCES listening_episodes(id) ON DELETE CASCADE,
      last_position_seconds INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      last_watched INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE(episode_id)
    );
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      filename TEXT NOT NULL,
      total_pages INTEGER,
      description TEXT,
      added_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS reading_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      current_page INTEGER NOT NULL DEFAULT 1,
      last_read INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE(book_id)
    );

    CREATE TABLE IF NOT EXISTS decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'anki',
      description TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS deck_settings (
      deck_id INTEGER PRIMARY KEY REFERENCES decks(id) ON DELETE CASCADE,
      daily_review_limit INTEGER NOT NULL DEFAULT 50,
      new_cards_per_day INTEGER NOT NULL DEFAULT 10,
      target_retention REAL NOT NULL DEFAULT 0.9
    );

    CREATE TABLE IF NOT EXISTS review_deck_assignments (
      review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
      deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
      PRIMARY KEY (review_id, deck_id)
    );

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      target INTEGER NOT NULL,
      period TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      active INTEGER NOT NULL DEFAULT 1
    );
  `);

  // Seed default settings
  const defaultSettings = [
    ['daily_review_limit', '50'],
    ['new_cards_per_day', '10'],
    ['target_retention', '0.90'],
    ['theme', 'system'],
    ['show_pronunciation', 'true'],
    ['use_onscreen_keyboard', 'auto'],
    ['daily_goal', '20'],
  ];

  const settingsStmt = rawDb.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of defaultSettings) {
    settingsStmt.run(key, value);
  }

  const listeningEpisodesSeed = [
    { episode_number: 1, title: 'Iyagi #1 – 좋아하는 계절 (Favorite Season)', series: 'TTMIK', level: 'beginner', description: null, youtube_id: null },
    { episode_number: 2, title: 'Iyagi #2 – 아침 (Morning)', series: 'TTMIK', level: 'beginner', description: null, youtube_id: null },
    { episode_number: 3, title: 'Iyagi #3 – 자기 전에 (Before Sleeping)', series: 'TTMIK', level: 'beginner', description: null, youtube_id: null },
    { episode_number: 4, title: 'Iyagi #4 – 일요일 오후 (Sunday Afternoon)', series: 'TTMIK', level: 'beginner', description: null, youtube_id: null },
    { episode_number: 5, title: 'Iyagi #5 – 음악 (Music)', series: 'TTMIK', level: 'beginner', description: null, youtube_id: null },
    { episode_number: 6, title: 'Iyagi #6 – 영화 (Movies)', series: 'TTMIK', level: 'beginner', description: null, youtube_id: null },
    { episode_number: 7, title: 'Iyagi #7 – 휴가 (Vacation)', series: 'TTMIK', level: 'beginner', description: null, youtube_id: null },
    { episode_number: 8, title: 'Iyagi #8 – 취미 (Hobbies)', series: 'TTMIK', level: 'beginner', description: null, youtube_id: null },
    { episode_number: 9, title: 'Iyagi #9 – 음식 (Food)', series: 'TTMIK', level: 'beginner', description: null, youtube_id: null },
    { episode_number: 10, title: 'Iyagi #10 – 친구 (Friends)', series: 'TTMIK', level: 'beginner', description: null, youtube_id: null },
    { episode_number: 11, title: 'Iyagi #11 – 날씨 (Weather)', series: 'TTMIK', level: 'beginner', description: null, youtube_id: null },
    { episode_number: 12, title: 'Iyagi #12 – 학교 (School)', series: 'TTMIK', level: 'beginner', description: null, youtube_id: null },
    { episode_number: 13, title: 'Iyagi #13 – 가족 (Family)', series: 'TTMIK', level: 'beginner', description: null, youtube_id: null },
    { episode_number: 14, title: 'Iyagi #14 – 건강 (Health)', series: 'TTMIK', level: 'beginner', description: null, youtube_id: null },
    { episode_number: 15, title: 'Iyagi #15 – 여행 (Travel)', series: 'TTMIK', level: 'beginner', description: null, youtube_id: null },
    { episode_number: 16, title: 'Iyagi #16 – 쇼핑 (Shopping)', series: 'TTMIK', level: 'beginner', description: null, youtube_id: null },
    { episode_number: 17, title: 'Iyagi #17 – 직업 (Jobs)', series: 'TTMIK', level: 'beginner', description: null, youtube_id: null },
    { episode_number: 18, title: 'Iyagi #18 – 운동 (Exercise)', series: 'TTMIK', level: 'beginner', description: null, youtube_id: null },
    { episode_number: 19, title: 'Iyagi #19 – 집 (Home)', series: 'TTMIK', level: 'beginner', description: null, youtube_id: null },
    { episode_number: 20, title: 'Iyagi #20 – 주말 (Weekend)', series: 'TTMIK', level: 'beginner', description: null, youtube_id: null },
  ];

  const listeningStmt = rawDb.prepare(
    'INSERT OR IGNORE INTO listening_episodes (episode_number, title, series, level, description, youtube_id) VALUES (?, ?, ?, ?, ?, ?)',
  );
  for (const e of listeningEpisodesSeed) {
    listeningStmt.run(e.episode_number, e.title, e.series, e.level, e.description, e.youtube_id);
  }

    rawDb.close();
    initialized = true;
  } finally {
    releaseLock();
  }
}
