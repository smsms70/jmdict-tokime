import { readFileSync, writeFileSync, createWriteStream, statSync } from "node:fs";
import { createInterface } from "node:readline";

const JMDICT_INPUT = "dist/jmdict-tokime.json";
const FREQ_INPUT = "dist/jpdb-freq-v2.json";
const OUTPUT = "dist/jmdict+jpdb-freq.json";

console.log("Loading frequency data...");
const freqData = JSON.parse(readFileSync(FREQ_INPUT, "utf-8"));
console.log(`Loaded ${Object.keys(freqData).length} frequency entries`);

interface JMdictEntry {
  id: string;
  kanji: { text: string; priority: string[]; freq?: number }[];
  kana: { text: string; priority: string[]; freq?: number }[];
  sense: {
    partOfSpeech: string[];
    gloss: { text: string; lang: string }[];
  }[];
}

const inputStream = createInterface({ input: createReadStream(JMDICT_INPUT) });
const outputStream = createWriteStream(OUTPUT);

let entryCount = 0;
let matchedCount = 0;

async function processEntry(line: string): Promise<string> {
  const entry: JMdictEntry = JSON.parse(line);
  const kanjiTexts = entry.kanji.map((k) => k.text);
  const kanaTexts = entry.kana.map((k) => k.text);

  // Get best frequencies for each form
  // idx 0 = kanji form (use slot 0), idx 1 = kana form (use slot 1)
  const kanjiFreqs: number[] = [];
  const kanaFreqs: number[] = [];

  // Try kanji|kana combinations
  for (const kanji of kanjiTexts) {
    for (const kana of kanaTexts) {
      const key = `${kanji}|${kana}`;
      const freqPair = freqData[key];
      if (freqPair) {
        // freqPair[0] = kanji freq, freqPair[1] = kana freq
        if (freqPair[0] > 0) kanjiFreqs.push(freqPair[0]);
        if (freqPair[1] > 0) kanaFreqs.push(freqPair[1]);
      }
    }
  }

  // Fallback: try kana|kana (for kana-only words)
  if (kanaFreqs.length === 0) {
    for (const kana of kanaTexts) {
      const key = `${kana}|${kana}`;
      const freqPair = freqData[key];
      if (freqPair) {
        if (freqPair[0] > 0) kanjiFreqs.push(freqPair[0]);
        if (freqPair[1] > 0) kanaFreqs.push(freqPair[1]);
      }
    }
  }

  // Assign the best (lowest) frequency to each element
  // For kanji elements: use the best kanji freq
  const bestKanjiFreq = kanjiFreqs.length > 0 ? Math.min(...kanjiFreqs) : undefined;
  // For kana elements: use the best kana freq
  const bestKanaFreq = kanaFreqs.length > 0 ? Math.min(...kanaFreqs) : undefined;

  if (bestKanjiFreq !== undefined) {
    for (const kanji of entry.kanji) {
      kanji.freq = bestKanjiFreq;
    }
    matchedCount++;
  }

  if (bestKanaFreq !== undefined) {
    for (const kana of entry.kana) {
      kana.freq = bestKanaFreq;
    }
    matchedCount++;
  }

  // Remove appliesToKanji if present (unused in app)
  for (const kana of entry.kana) {
    delete (kana as Record<string, unknown>).appliesToKanji;
  }

  return JSON.stringify(entry);
}

import { createReadStream } from "node:fs";

console.log("Processing entries...");

for await (const line of inputStream) {
  if (!line.trim()) continue;
  const processed = await processEntry(line);
  outputStream.write(processed + "\n");
  entryCount++;
}

outputStream.end();

outputStream.on("finish", () => {
  const stats = statSync(OUTPUT);
  console.log(`Processed ${entryCount} entries`);
  console.log(`Matched ${matchedCount} entries with frequency`);
  console.log(`Output: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log("Done!");
});