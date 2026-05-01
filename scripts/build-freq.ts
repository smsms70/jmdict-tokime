import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { strFromU8, unzipSync } from 'fflate'
import path from "node:path";

const JPDB_FREQ_PATH = "../raw dict/JPDB_v2.2_Frequency_Kana_2024-10-13.zip";
const JPDB_FREQ_OUTPUT = "dist/jpdb-freq-v2.json";


mkdirSync("dist", { recursive: true });

const zipFilePath = path.resolve(import.meta.dir, JPDB_FREQ_PATH);
const zipData = new Uint8Array(readFileSync(zipFilePath));

const unzipData = unzipSync(zipData);
const jsonData = strFromU8(unzipData['term_meta_bank_1.json'])
const data = JSON.parse(jsonData)


const result: Record<string, [number, number]> = {}

for (const entry of data) {
  const word = entry[0]
  const meta = entry[2]

  if (meta.reading) {
    const key = `${word}|${meta.reading}`
    const display = meta.frequency?.displayValue || ''
    const freq = meta.frequency?.value || 0
    const isKana = display.includes('㋕')

    if (!result[key]) result[key] = [0, 0]
    if (isKana) {
      result[key][1] = result[key][1] === 0 ? freq : Math.min(result[key][1], freq)
    } else {
      result[key][0] = result[key][0] === 0 ? freq : Math.min(result[key][0], freq)
    }
  } else {
    const key = `${word}|${word}`
    const freq = meta.value || 0
    if (!result[key]) result[key] = [freq, freq]
    else result[key] = [Math.min(result[key][0], freq), Math.min(result[key][1], freq)]
  }
}

// Fill in missing values with fallback from the other slot
for (const key of Object.keys(result)) {
  const [kanji, kana] = result[key]
  if (kana === 0) result[key] = [kanji, kanji]
  if (kanji === 0) result[key] = [kana, kana]
}

writeFileSync(JPDB_FREQ_OUTPUT, JSON.stringify(result), 'utf8')
console.log(`Output: ${Object.keys(result).length} entries`)
