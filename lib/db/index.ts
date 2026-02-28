import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'quiko.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Singleton pattern to prevent multiple connections during hot reloads
const globalForDb = global as typeof globalThis & {
    __db: Database.Database | undefined;
};

function getDatabase(): Database.Database {
    if (!globalForDb.__db) {
        globalForDb.__db = new Database(DB_PATH);
        // Enable WAL mode for better performance
        globalForDb.__db.pragma('journal_mode = WAL');
        globalForDb.__db.pragma('foreign_keys = ON');
    }
    return globalForDb.__db;
}

export const db = drizzle(getDatabase(), { schema });
export { schema };
