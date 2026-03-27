import { readFileSync, writeFileSync, statSync } from "node:fs";
import { zipSync } from "fflate";

const FILES = [
  { input: "dist/jmdict-tokime.json", output: "dist/jmdict-tokime.json.zip" },
  { input: "dist/jmdict-common.json", output: "dist/jmdict-common.json.zip" },
];

const stats: Record<string, { uncompressedBytes: number; compressedBytes: number; ratio: number }> = {};

for (const file of FILES) {
  console.log(`Processing ${file.input}...`);

  const inputBuffer = readFileSync(file.input);
  const inputSize = inputBuffer.byteLength;

  console.log(`  Uncompressed size: ${(inputSize / 1024 / 1024).toFixed(2)} MB`);

  const filename = file.input.replace("dist/", "");
  const compressed = zipSync({ [filename]: inputBuffer });
  writeFileSync(file.output, compressed);

  const outputSize = compressed.byteLength;
  const ratio = (1 - outputSize / inputSize) * 100;

  console.log(`  Compressed size: ${(outputSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Compression ratio: ${ratio.toFixed(1)}%`);

  stats[file.input.replace("dist/", "")] = {
    uncompressedBytes: inputSize,
    compressedBytes: outputSize,
    ratio,
  };
}

writeFileSync("dist/compress-stats.json", JSON.stringify(stats, null, 2));
console.log("Done!");
