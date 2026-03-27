import { writeFile, mkdir } from "node:fs/promises";
import { createGunzip } from "node:zlib";
import { Readable } from "node:stream";

const URL = "https://www.edrdg.org/pub/Nihongo/JMdict_e.gz";
const GZ_PATH = "raw/JMdict_e.gz";
const XML_PATH = "raw/JMdict_e.xml";

async function download() {
  console.log(`Fetching ${URL}...`);

  const response = await fetch(URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  const gzBuffer = await response.arrayBuffer();
  const gzSize = gzBuffer.byteLength;

  await mkdir("raw", { recursive: true });
  await writeFile(GZ_PATH, Buffer.from(gzBuffer));

  console.log(`Downloaded: ${GZ_PATH} (${formatSize(gzSize)})`);

  console.log("Decompressing...");
  const gunzip = createGunzip();
  const chunks: Buffer[] = [];

  const readable = Readable.from(Buffer.from(gzBuffer));
  readable.pipe(gunzip);

  for await (const chunk of gunzip) {
    chunks.push(chunk);
  }

  const xmlBuffer = Buffer.concat(chunks);
  const xmlSize = xmlBuffer.byteLength;

  await writeFile(XML_PATH, xmlBuffer);

  console.log(`Decompressed: ${XML_PATH} (${formatSize(xmlSize)})`);
  console.log(`Compression ratio: ${((1 - xmlSize / gzSize) * 100).toFixed(1)}%`);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

download().catch((err) => {
  console.error(err);
  process.exit(1);
});
