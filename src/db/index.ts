import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { resolve } from "path";

const DB_PATH = process.env.DATABASE_URL || "./data/keepomat.db";

// SQLite-Datenbank erstellen / öffnen
const sqlite = new Database(DB_PATH);

// WAL-Mode für bessere Performance bei gleichzeitigen Reads
sqlite.run("PRAGMA journal_mode = WAL;");
sqlite.run("PRAGMA foreign_keys = ON;");
sqlite.run("PRAGMA busy_timeout = 5000;");

// Drizzle ORM initialisieren
export const db = drizzle(sqlite, { schema });

// Datenbank migrieren
export function runMigrations() {
  try {
    migrate(db, { migrationsFolder: resolve(import.meta.dir, "migrations") });
    console.log("✅ Database migrations applied");
  } catch (error) {
    console.error("❌ Migration error:", error);
  }
}

// FTS5 Volltextsuche einrichten
export function setupFTS() {
  sqlite.run(`
    CREATE VIRTUAL TABLE IF NOT EXISTS bookmarks_fts USING fts5(
      title,
      description,
      ai_summary,
      url,
      content='bookmarks',
      content_rowid='id'
    );
  `);

  // Trigger für automatische Synchronisierung
  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS bookmarks_fts_insert AFTER INSERT ON bookmarks BEGIN
      INSERT INTO bookmarks_fts(rowid, title, description, ai_summary, url)
      VALUES (new.id, new.title, new.description, new.ai_summary, new.url);
    END;
  `);

  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS bookmarks_fts_delete AFTER DELETE ON bookmarks BEGIN
      INSERT INTO bookmarks_fts(bookmarks_fts, rowid, title, description, ai_summary, url)
      VALUES ('delete', old.id, old.title, old.description, old.ai_summary, old.url);
    END;
  `);

  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS bookmarks_fts_update AFTER UPDATE ON bookmarks BEGIN
      INSERT INTO bookmarks_fts(bookmarks_fts, rowid, title, description, ai_summary, url)
      VALUES ('delete', old.id, old.title, old.description, old.ai_summary, old.url);
      INSERT INTO bookmarks_fts(rowid, title, description, ai_summary, url)
      VALUES (new.id, new.title, new.description, new.ai_summary, new.url);
    END;
  `);

  console.log("✅ FTS5 full-text search ready");
}

// Raw SQLite-Zugriff für FTS-Queries
export { sqlite };
