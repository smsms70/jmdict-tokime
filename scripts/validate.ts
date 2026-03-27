import { readFileSync } from "node:fs";
import { gunzipSync } from "fflate";

const ZIP_PATH = "dist/jmdict-tokime.json.zip";

const SPOT_CHECK_ENTRIES = [
  { id: "1289400", expectedKanji: "今日は", expectedKana: "こんにちは" },
  { id: "1464530", expectedKanji: "日本語", expectedKana: "にほんご" },
  { id: "1507090", expectedKanji: "平仮名", expectedKana: "ひらがな" },
];

console.log(`Reading ${ZIP_PATH}...`);
const zipBuffer = readFileSync(ZIP_PATH);

console.log("Decompressing...");
const jsonBuffer = gunzipSync(zipBuffer);
const jsonStr = new TextDecoder().decode(jsonBuffer);

console.log("Parsing entries...");
const lines = jsonStr.trim().split("\n");

const entriesById = new Map<string, unknown>();
for (const line of lines) {
  const entry = JSON.parse(line);
  entriesById.set(entry.id, entry);
}

console.log(`Total entries: ${entriesById.size}\n`);

let passed = 0;
let failed = 0;

for (const check of SPOT_CHECK_ENTRIES) {
  const entry = entriesById.get(check.id);

  if (!entry) {
    console.log(`❌ ${check.id}: Entry not found`);
    failed++;
    continue;
  }

  const hasId = "id" in entry && entry.id === check.id;
  const hasKanji = "kanji" in entry && Array.isArray(entry.kanji);
  const hasKana = "kana" in entry && Array.isArray(entry.kana);
  const hasSense = "sense" in entry && Array.isArray(entry.sense);

  const kanjiTexts = hasKanji ? (entry.kanji as unknown[]).map((k: unknown) => (k as { text: string }).text) : [];
  const kanaTexts = hasKana ? (entry.kana as unknown[]).map((k: unknown) => (k as { text: string }).text) : [];

  const hasExpectedKanji = kanjiTexts.includes(check.expectedKanji);
  const hasExpectedKana = kanaTexts.includes(check.expectedKana);

  const kanjiHasPriority = hasKanji && (entry.kanji as unknown[]).some(
    (k: unknown) => (k as { priority: unknown[] }).priority && (k as { priority: unknown[] }).priority.length > 0
  );
  const kanaHasPriority = hasKana && (entry.kana as unknown[]).some(
    (k: unknown) => (k as { priority: unknown[] }).priority && (k as { priority: unknown[] }).priority.length > 0
  );

  const allGlosses: string[] = [];
  if (hasSense) {
    for (const sense of entry.sense as unknown[]) {
      if ("gloss" in sense && Array.isArray(sense.gloss)) {
        for (const g of sense.gloss) {
          if (typeof g === "object" && g !== null && "text" in g) {
            allGlosses.push((g as { text: string }).text);
          }
        }
      }
    }
  }
  const hasGloss = allGlosses.length > 0;

  const isValid = hasId && hasKanji && hasKana && hasSense && (hasExpectedKanji || hasExpectedKana) && (kanjiHasPriority || kanaHasPriority) && hasGloss;

  if (isValid) {
    console.log(`✅ ${check.id}: ${check.expectedKanji || ""} / ${check.expectedKana}`);
    console.log(`   kanji: ${kanjiTexts.join(", ")}`);
    console.log(`   kana: ${kanaTexts.join(", ")}`);
    console.log(`   glosses: ${allGlosses.slice(0, 3).join(", ")}${allGlosses.length > 3 ? "..." : ""}`);
    passed++;
  } else {
    console.log(`❌ ${check.id}: Validation failed`);
    console.log(`   hasId: ${hasId}, hasKanji: ${hasKanji}, hasKana: ${hasKana}, hasSense: ${hasSense}`);
    console.log(`   hasExpectedKanji: ${hasExpectedKanji}, hasExpectedKana: ${hasExpectedKana}`);
    console.log(`   kanjiHasPriority: ${kanjiHasPriority}, kanaHasPriority: ${kanaHasPriority}, hasGloss: ${hasGloss}`);
    failed++;
  }
  console.log("");
}

console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
