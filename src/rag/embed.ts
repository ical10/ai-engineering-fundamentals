import { readdir, readFile } from "node:fs/promises";
import { join, parse, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getIndex } from "./vector-store";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CORPUS_DIR = join(__dirname, "..", "..", "data", "corpus");

async function main() {
  const index = getIndex({
    UPSTASH_VECTOR_REST_URL: process.env.UPSTASH_VECTOR_REST_URL,
    UPSTASH_VECTOR_REST_TOKEN: process.env.UPSTASH_VECTOR_REST_TOKEN,
  });

  // Every run wipes the index clean,
  // so running 1 time or N times will produce the same end state.
  // Drop everything, re-upload all.
  // Costs a full re-embed every run.
  console.log("Resetting index...");
  await index.reset();

  const entries = await readdir(CORPUS_DIR);
  const files = entries.filter((f) => f.endsWith(".md"));
  console.log(`Found ${files.length} corpus files in ${CORPUS_DIR}`);

  let ok = 0;
  let failed = 0;
  for (const file of files) {
    const id = parse(file).name;
    try {
      const content = await readFile(join(CORPUS_DIR, file), "utf8");
      await index.upsert({
        id,
        data: content,
        metadata: { source: file, content },
      });
      console.log(`upserted ${id}`);
      ok++;
    } catch (err) {
      console.error(
        `failed ${id}: ${err instanceof Error ? err.message : String(err)}`,
      );
      failed++;
    }
  }

  console.log(`Done. ${ok} upserted, ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
