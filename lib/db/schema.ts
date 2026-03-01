import { sqliteTable, text, integer, real, primaryKey, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const sentences = sqliteTable('sentences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  korean: text('korean').notNull(),
  literal_translation: text('literal_translation'),
  natural_translation: text('natural_translation').notNull(),
  audio_url: text('audio_url'),
  source: text('source'),
  level: text('level'),
  notes: text('notes'),
  created_at: integer('created_at').notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
  updated_at: integer('updated_at').notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export const words = sqliteTable('words', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  hangul: text('hangul').notNull().unique(),
  hanja: text('hanja'),
  pronunciation: text('pronunciation'),
  audio_url: text('audio_url'),
  pos: text('pos'),
  level: text('level'),
  frequency_rank: integer('frequency_rank'),
  stem: text('stem'),
  irregular_type: text('irregular_type'),
  honorific_plain: text('honorific_plain'),
  notes: text('notes'),
  tags: text('tags'),
  created_at: integer('created_at').notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
  updated_at: integer('updated_at').notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export const wordDefinitions = sqliteTable('word_definitions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  word_id: integer('word_id').notNull().references(() => words.id, { onDelete: 'cascade' }),
  definition_ko: text('definition_ko'),
  definition_en: text('definition_en'),
  order_num: integer('order_num'),
  krdict_target_code: text('krdict_target_code'),
});

export const wordExamples = sqliteTable('word_examples', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  word_id: integer('word_id').notNull().references(() => words.id, { onDelete: 'cascade' }),
  example_ko: text('example_ko'),
  example_en: text('example_en'),
  source: text('source'),
});

export const sentenceWords = sqliteTable('sentence_words', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sentence_id: integer('sentence_id').notNull().references(() => sentences.id, { onDelete: 'cascade' }),
  word_id: integer('word_id').notNull().references(() => words.id, { onDelete: 'cascade' }),
  position: integer('position'),
  surface_form: text('surface_form'),
  morpheme_breakdown: text('morpheme_breakdown'),
  grammatical_role: text('grammatical_role'),
  particle_attached: text('particle_attached'),
});

export const grammarPatterns = sqliteTable('grammar_patterns', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  pattern: text('pattern').notNull().unique(),
  name_ko: text('name_ko'),
  name_en: text('name_en').notNull(),
  description: text('description').notNull(),
  level: text('level'),
  category: text('category'),
  formality: text('formality'),
  example_pattern_use: text('example_pattern_use'),
  notes: text('notes'),
});

export const sentenceGrammarPatterns = sqliteTable('sentence_grammar_patterns', {
  sentence_id: integer('sentence_id').notNull().references(() => sentences.id, { onDelete: 'cascade' }),
  grammar_pattern_id: integer('grammar_pattern_id').notNull().references(() => grammarPatterns.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.sentence_id, t.grammar_pattern_id] }),
}));

export const reviews = sqliteTable('reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  item_type: text('item_type').notNull(),
  item_id: integer('item_id').notNull(),
  review_mode: text('review_mode').notNull(),
  due: integer('due').notNull(),
  stability: real('stability').notNull().default(0),
  difficulty: real('difficulty').notNull().default(0),
  elapsed_days: integer('elapsed_days').notNull().default(0),
  scheduled_days: integer('scheduled_days').notNull().default(0),
  reps: integer('reps').notNull().default(0),
  lapses: integer('lapses').notNull().default(0),
  state: integer('state').notNull().default(0),
  last_review: integer('last_review'),
}, (t) => ({
  uniq: uniqueIndex('reviews_unique').on(t.item_type, t.item_id, t.review_mode),
}));

export const reviewLogs = sqliteTable('review_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  review_id: integer('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  user_answer: text('user_answer'),
  was_correct: integer('was_correct'),
  time_spent_ms: integer('time_spent_ms'),
  reviewed_at: integer('reviewed_at').notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
  session_id: text('session_id'),
  note: text('note'),
});

export const krdictCache = sqliteTable('krdict_cache', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  query: text('query').notNull().unique(),
  response_xml: text('response_xml').notNull(),
  cached_at: integer('cached_at').notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export const books = sqliteTable('books', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  filename: text('filename').notNull(),
  total_pages: integer('total_pages'),
  description: text('description'),
  added_at: integer('added_at').notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export const readingProgress = sqliteTable('reading_progress', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  book_id: integer('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  current_page: integer('current_page').notNull().default(1),
  last_read: integer('last_read').notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
}, (t) => ({
  uniq: uniqueIndex('reading_progress_unique').on(t.book_id),
}));

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value'),
});

export const listeningEpisodes = sqliteTable('listening_episodes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  series: text('series').notNull().default('TTMIK'),
  level: text('level'),
  episode_number: integer('episode_number'),
  youtube_id: text('youtube_id'),
  thumbnail_url: text('thumbnail_url'),
  duration_seconds: integer('duration_seconds'),
  description: text('description'),
  added_at: integer('added_at').notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export const listeningTranscripts = sqliteTable('listening_transcripts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  episode_id: integer('episode_id').notNull().references(() => listeningEpisodes.id, { onDelete: 'cascade' }),
  start_ms: integer('start_ms').notNull(),
  end_ms: integer('end_ms').notNull(),
  text: text('text').notNull(),
}, (t) => ({
  uniq: uniqueIndex('listening_transcripts_unique').on(t.episode_id, t.start_ms),
}));

export const listeningProgress = sqliteTable('listening_progress', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  episode_id: integer('episode_id').notNull().references(() => listeningEpisodes.id, { onDelete: 'cascade' }),
  last_position_seconds: integer('last_position_seconds').notNull().default(0),
  completed: integer('completed').notNull().default(0),
  last_watched: integer('last_watched').notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
}, (t) => ({
  uniq: uniqueIndex('listening_progress_unique').on(t.episode_id),
}));

export const decks = sqliteTable('decks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  source: text('source').notNull().default('anki'), // 'anki' | 'manual'
  description: text('description'),
  created_at: integer('created_at').notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export const deckSettings = sqliteTable('deck_settings', {
  deck_id: integer('deck_id').primaryKey().references(() => decks.id, { onDelete: 'cascade' }),
  daily_review_limit: integer('daily_review_limit').notNull().default(50),
  new_cards_per_day: integer('new_cards_per_day').notNull().default(10),
  target_retention: real('target_retention').notNull().default(0.9),
});

export const reviewDeckAssignments = sqliteTable('review_deck_assignments', {
  review_id: integer('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
  deck_id: integer('deck_id').notNull().references(() => decks.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.review_id, t.deck_id] }),
}));

export const goals = sqliteTable('goals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(), // 'words_learned' | 'reviews_completed'
  target: integer('target').notNull(),
  period: text('period').notNull(), // 'week' | 'month'
  created_at: integer('created_at').notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
  active: integer('active').notNull().default(1), // 1 = active
});

export type Sentence = typeof sentences.$inferSelect;
export type NewSentence = typeof sentences.$inferInsert;
export type Word = typeof words.$inferSelect;
export type NewWord = typeof words.$inferInsert;
export type WordDefinition = typeof wordDefinitions.$inferSelect;
export type WordExample = typeof wordExamples.$inferSelect;
export type SentenceWord = typeof sentenceWords.$inferSelect;
export type GrammarPattern = typeof grammarPatterns.$inferSelect;
export type NewGrammarPattern = typeof grammarPatterns.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type ReviewLog = typeof reviewLogs.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type ListeningEpisode = typeof listeningEpisodes.$inferSelect;
export type ListeningTranscript = typeof listeningTranscripts.$inferSelect;
export type ListeningProgress = typeof listeningProgress.$inferSelect;
export type Deck = typeof decks.$inferSelect;
export type DeckSettings = typeof deckSettings.$inferSelect;
export type ReviewDeckAssignment = typeof reviewDeckAssignments.$inferSelect;
export type Goal = typeof goals.$inferSelect;
