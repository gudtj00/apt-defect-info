// 일회성 마이그레이션: 기존에 kaptCode.toLowerCase()로 만들어졌던 슬러그를
// lib/slug.ts의 buildAptSlug(지역+단지명 로마자 + kaptCode)로 재생성한다.
// 아직 배포 전이라 외부에 노출된 URL이 없으므로 리다이렉트 없이 그냥 값을 바꾼다.
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../lib/db/schema.ts";
import { buildAptSlug } from "../lib/slug.ts";
import path from "node:path";

const dbPath = path.join(process.cwd(), "data", "apt-defect.sqlite");
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

const rows = db.select().from(schema.complexes).all();
console.log(`대상: ${rows.length}건`);

const update = sqlite.prepare("UPDATE complexes SET slug = ? WHERE kapt_code = ?");
const newSlugs = new Set();
let changed = 0;
let collided = 0;

const tx = sqlite.transaction(() => {
  for (const row of rows) {
    const newSlug = buildAptSlug(row.region, row.name, row.kaptCode);
    if (newSlugs.has(newSlug)) {
      collided++;
      console.error(`충돌 발견: ${newSlug} (kaptCode=${row.kaptCode}) — 건너뜀`);
      continue;
    }
    newSlugs.add(newSlug);
    if (newSlug !== row.slug) {
      update.run(newSlug, row.kaptCode);
      changed++;
    }
  }
});
tx();

console.log(`변경됨: ${changed}건, 충돌(건너뜀): ${collided}건`);

const uniqueCount = db.select({ slug: schema.complexes.slug }).from(schema.complexes).all();
const uniqueSet = new Set(uniqueCount.map((r) => r.slug));
console.log(`DB 전체 슬러그 유일성 확인: 전체 ${uniqueCount.length}건, 유일 ${uniqueSet.size}건`);

console.log("\n샘플 5건:");
sqlite
  .prepare("SELECT kapt_code, slug, name FROM complexes ORDER BY RANDOM() LIMIT 5")
  .all()
  .forEach((r) => console.log(r));
