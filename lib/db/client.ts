import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

const DB_FILE = "apt-defect.sqlite";

// 2026-08-10: git 자동 배포에서만 SQLITE_CANTOPEN이 재발했다 (CLI 배포는 정상).
// process.cwd() 기준 한 경로만 보던 게 원인으로 의심되므로, 서버리스 번들에서
// 실제로 존재하는 경로를 찾아서 연다. 전부 실패하면 어디를 봤는지 남긴다.
function resolveDbPath(): string {
  const candidates = [
    path.join(process.cwd(), "data", DB_FILE),
    // Next.js가 트레이싱한 파일을 함수 루트 아래 보존하는 경우들
    path.join(process.cwd(), ".next", "server", "data", DB_FILE),
    path.join(process.cwd(), "apps", "web", "data", DB_FILE),
    path.join("/var/task", "data", DB_FILE),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  const cwd = process.cwd();
  let listing = "";
  try {
    listing = fs.readdirSync(cwd).join(", ");
  } catch {
    listing = "(cwd 읽기 실패)";
  }
  throw new Error(
    `SQLite DB not found. cwd=${cwd}; cwd entries=[${listing}]; ` +
      `tried=[${candidates.join(" | ")}]`,
  );
}

const DB_PATH = resolveDbPath();

// Vercel's serverless filesystem is read-only outside /tmp. The app never
// writes to this DB at runtime (only the local ingest script does), so open
// read-only in production to avoid WAL journal file writes failing there.
const isReadOnly = !!process.env.VERCEL;
const sqlite = new Database(DB_PATH, isReadOnly ? { readonly: true } : {});
if (!isReadOnly) {
  sqlite.pragma("journal_mode = WAL");
}

export const db = drizzle(sqlite, { schema });
