import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

const DB_PATH = path.join(process.cwd(), "data", "apt-defect.sqlite");

// 2026-08-10: 배포 환경에서 SQLITE_CANTOPEN이 반복됐다.
//
// 원인: 이 DB 파일이 WAL 모드로 저장돼 있었다. WAL 모드는 열 때 `-shm` 보조
// 파일을 생성해야 하는데, Vercel 서버리스는 /tmp 밖이 읽기 전용이라 생성에
// 실패하고 파일 자체를 못 연다. CLI 배포는 로컬의 `-shm`/`-wal`을 같이
// 올려서 우연히 동작했고, git 배포는 그 두 파일이 .gitignore로 빠져 있어
// 실패했다 — 배포 방식에 따라 갈리던 증상의 정체가 이것이다.
//
// 그래서 이 파일은 롤백 저널 모드(비-WAL)로 커밋하며, 여기서 WAL을 다시
// 켜지 않는다. 켜는 순간 파일 헤더가 WAL로 바뀌어 배포가 다시 깨진다.
// 이 앱은 런타임에 DB를 쓰지 않고(적재는 로컬 파이프라인 전용) 읽기만 하므로
// WAL의 동시 쓰기 이점이 필요 없다.
if (!fs.existsSync(DB_PATH)) {
  throw new Error(`SQLite DB not found at ${DB_PATH} (cwd=${process.cwd()})`);
}

// 배포 환경에서는 읽기 전용으로 연다 (파일시스템이 읽기 전용이므로).
const sqlite = new Database(DB_PATH, process.env.VERCEL ? { readonly: true } : {});

export const db = drizzle(sqlite, { schema });
