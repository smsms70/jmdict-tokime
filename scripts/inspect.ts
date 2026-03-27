import { readFileSync } from "node:fs";
import { XMLParser } from "fast-xml-parser";

const XML_PATH = "raw/JMdict_e.xml";

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
console.log(`File size: ${(xmlContent.length / 1024 / 1024).toFixed(1)} MB\n`);

console.log("Parsing...");
const result = parser.parse(xmlContent);
const entries = result.JMdict.entry;

console.log(`Total entries in file: ${entries.length}\n`);

console.log("=== First 10 entries (raw) ===\n");
for (let i = 0; i < Math.min(10, entries.length); i++) {
  console.log(`--- Entry ${i + 1} ---`);
  console.log(JSON.stringify(entries[i], null, 2));
  console.log("");
}

console.log("=== Scanning all entries for unique priority tags ===\n");

const kePriSet = new Set<string>();
const rePriSet = new Set<string>();

for (const entry of entries) {
  const kanji = entry.k_ele;
  if (kanji) {
    const kanjiArr = Array.isArray(kanji) ? kanji : [kanji];
    for (const k of kanjiArr) {
      const pri = k.ke_pri;
      if (pri) {
        const arr = Array.isArray(pri) ? pri : [pri];
        for (const p of arr) {
          kePriSet.add(p);
        }
      }
    }
  }

  const kana = entry.r_ele;
  if (kana) {
    const kanaArr = Array.isArray(kana) ? kana : [kana];
    for (const k of kanaArr) {
      const pri = k.re_pri;
      if (pri) {
        const arr = Array.isArray(pri) ? pri : [pri];
        for (const p of arr) {
          rePriSet.add(p);
        }
      }
    }
  }
}

console.log("Unique ke_pri tags:", Array.from(kePriSet).sort().join(", ") || "(none)");
console.log("Unique re_pri tags:", Array.from(rePriSet).sort().join(", ") || "(none)");
