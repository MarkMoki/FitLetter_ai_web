
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

const sqlite = new Database('sqlite.db');
export const db = drizzle(sqlite, { schema });

// --- One-time Database Initialization ---
function initializeDB() {
    console.log('Running one-time database initialization...');
    try {
        // Use raw SQL to create tables if they don't exist. This is more resilient than migrations for setup.
        sqlite.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                name TEXT,
                email TEXT NOT NULL UNIQUE,
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
            );
            CREATE TABLE IF NOT EXISTS resumes (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                email TEXT NOT NULL,
                linkedin_url TEXT,
                portfolio_url TEXT,
                summary TEXT NOT NULL,
                skills TEXT NOT NULL,
                experiences TEXT NOT NULL,
                projects TEXT NOT NULL,
                education TEXT NOT NULL,
                user_id INTEGER NOT NULL,
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                updated_at INTEGER,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS letters (
                id INTEGER PRIMARY KEY,
                job_title TEXT NOT NULL,
                company TEXT NOT NULL,
                job_desc TEXT NOT NULL,
                content TEXT NOT NULL,
                tone TEXT NOT NULL,
                ats_score INTEGER,
                user_id INTEGER NOT NULL,
                resume_id INTEGER NOT NULL,
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY,
                job_title TEXT NOT NULL,
                company TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Saved',
                url TEXT,
                deadline INTEGER,
                user_id INTEGER NOT NULL,
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);
        console.log('✅ Tables created or already exist.');
        
        console.log('Database initialization complete.');
    } catch (e) {
        console.error('Database initialization failed:', e);
        // Exit process if DB setup fails, as the app is unusable
        process.exit(1);
    }
}

// Run initialization
initializeDB();
