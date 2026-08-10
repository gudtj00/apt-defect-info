import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import * as schema from "./schema";

const DB_PATH = path.join(process.cwd(), "data", "apt-defect.sqlite");

// Vercel's serverless filesystem is read-only outside /tmp. The app never
// writes to this DB at runtime (only the local ingest script does), so open
// read-only in production to avoid WAL journal file writes failing there.
const isReadOnly = !!process.env.VERCEL;
const sqlite = new Database(DB_PATH, isReadOnly ? { readonly: true } : {});
if (!isReadOnly) {
  sqlite.pragma("journal_mode = WAL");
}

export const db = drizzle(sqlite, { schema });
