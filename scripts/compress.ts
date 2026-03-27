import { readFileSync, writeFileSync, statSync } from "node:fs";
import { unzlibSync, gzipSync } from "fflate";

const INPUT_PATH = "dist/jmdict-tokime.json";
const OUTPUT_PATH = "dist/jmdict-tokime.json.zip";

console.log(`Reading ${INPUT_PATH}...`);
const inputBuffer = readFileSync(INPUT_PATH);
const inputSize = inputBuffer.byteLength;

console.log(`Uncompressed size: ${(inputSize / 1024 / 1024).toFixed(2)} MB`);

console.log("Compressing...");
const compressed = gzipSync(inputBuffer);

writeFileSync(OUTPUT_PATH, compressed);

const outputSize = compressed.byteLength;
const output = {
  uncompressedBytes: inputSize,
  compressedBytes: outputSize,
  ratio: (1 - outputSize / inputSize) * 100,
};
require("node:fs").writeFileSync("dist/compress-stats.json", JSON.stringify(output));

console.log(`Compressed size: ${(outputSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`Compression ratio: ${((1 - outputSize / inputSize) * 100).toFixed(1)}%`);
console.log("Done!");
