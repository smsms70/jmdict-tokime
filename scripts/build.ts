import { readFileSync, writeFileSync, createWriteStream } from "node:fs";
import { XMLParser } from "fast-xml-parser";
import { Transform } from "node:stream";

const XML_PATH = "raw/JMdict_e.xml";
const OUTPUT_PATH = "dist/jmdict-tokime.json";

interface JMdictEntry {
  id: string;
  kanji: { text: string; priority: string[] }[];
  kana: { text: string; priority: string[]; appliesToKanji: string[] }[];
  sense: {
    partOfSpeech: string[];
    gloss: { text: string; lang: string }[];
  }[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  processEntities: {
    enabled: true,
    maxEntityCount: 1000,
    maxTotalExpansions: 1000000,
    maxExpandedLength: 100000000,
  },
});

console.log(`Reading ${XML_PATH}...`);
const xmlContent = readFileSync(XML_PATH, "utf-8");

console.log("Parsing XML...");
const result = parser.parse(xmlContent);
const entries = result.JMdict.entry;

console.log(`Total entries in source: ${entries.length}`);

console.log("Processing entries...");

const VALID_PRI_TAGS = new Set([
  "ichi1", "ichi2", "spec1", "spec2", "news1", "news2", "gai1",
  ...Array.from({ length: 48 }, (_, i) => `nf${String(i + 1).padStart(2, "0")}`),
]);

function hasValidPriority(pri: string | string[] | undefined): boolean {
  if (!pri) return false;
  const arr = Array.isArray(pri) ? pri : [pri];
  return arr.some((p) => VALID_PRI_TAGS.has(p));
}

function normalizeArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function extractSense(sense: unknown): {
  partOfSpeech: string[];
  gloss: { text: string; lang: string }[];
}[] {
  const senses = normalizeArray(sense);
  const result: {
    partOfSpeech: string[];
    gloss: { text: string; lang: string }[];
  }[] = [];

  for (const s of senses) {
    const senseObj = s as Record<string, unknown>;

    const posArr = normalizeArray(senseObj.pos);
    const partOfSpeech = posArr.map(String);

    const glossRaw = senseObj.gloss;
    const glossArr = normalizeArray(glossRaw);
    const gloss: { text: string; lang: string }[] = [];

    for (const g of glossArr) {
      if (typeof g === "string") {
        gloss.push({ text: g, lang: "eng" });
      } else if (g && typeof g === "object") {
        const gObj = g as Record<string, unknown>;
        const lang = (gObj["@_xml:lang"] as string) || "eng";
        const text = gObj["#text"] as string;
        if (text) {
          gloss.push({ text, lang: lang === "eng" ? "eng" : lang });
        }
      }
    }

    if (gloss.length > 0) {
      result.push({ partOfSpeech, gloss });
    }
  }

  return result;
}

const writeStream = createWriteStream(OUTPUT_PATH);
let entryCount = 0;
let filteredCount = 0;

for (const entry of entries) {
  const id = String(entry.ent_seq);

  const kanjiRaw = normalizeArray(entry.k_ele);
  const kanji = kanjiRaw
    .map((k: unknown) => {
      const ke = k as Record<string, unknown>;
      const text = ke.keb as string;
      const pri = ke.ke_pri as string | string[] | undefined;
      return { text, priority: normalizeArray(pri) };
    })
    .filter((k) => k.text);

  const kanaRaw = normalizeArray(entry.r_ele);
  const kana = kanaRaw
    .map((r: unknown) => {
      const re = r as Record<string, unknown>;
      const text = re.reb as string;
      const pri = re.re_pri as string | string[] | undefined;
      const restr = re.re_restr as string | string[] | undefined;
      return {
        text,
        priority: normalizeArray(pri),
        appliesToKanji: normalizeArray(restr),
      };
    })
    .filter((k) => k.text);

  const senses = extractSense(entry.sense);
  if (senses.length === 0) continue;

  const hasKanjiPriority = kanji.some((k) => hasValidPriority(k.priority));
  const hasKanaPriority = kana.some((k) => hasValidPriority(k.priority));
  if (!hasKanjiPriority && !hasKanaPriority) continue;

  const processed: JMdictEntry = {
    id,
    kanji,
    kana,
    sense: senses,
  };

  writeStream.write(JSON.stringify(processed) + "\n");
  filteredCount++;
}

writeStream.end();

writeStream.on("finish", () => {
  const stats = require("node:fs").statSync(OUTPUT_PATH);
  const output = {
    totalSource: entries.length,
    filtered: filteredCount,
    sizeBytes: stats.size,
  };
  require("node:fs").writeFileSync("dist/build-stats.json", JSON.stringify(output));
  console.log(`Entries after filtering: ${filteredCount}`);
  console.log(`Output size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log("Done!");
});
