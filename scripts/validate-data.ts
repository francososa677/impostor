import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORDS_DIR = path.resolve(__dirname, "../data/words");

interface WordItem {
  word: string;
  category: string;
  contextClue: string;
  aliases?: string[];
}

function validateDatasets(): boolean {
  console.log("🔍 Validating datasets in:", WORDS_DIR);

  if (!fs.existsSync(WORDS_DIR)) {
    console.error("❌ Words directory does not exist:", WORDS_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(WORDS_DIR).filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    console.error("❌ No JSON files found in words directory!");
    process.exit(1);
  }

  let totalWords = 0;
  let hasErrors = false;

  for (const file of files) {
    const filePath = path.join(WORDS_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");

    let data: unknown;
    try {
      data = JSON.parse(content);
    } catch (err) {
      console.error(`❌ ${file}: Invalid JSON syntax!`, err);
      hasErrors = true;
      continue;
    }

    if (!Array.isArray(data)) {
      console.error(`❌ ${file}: Root must be an array of word entries!`);
      hasErrors = true;
      continue;
    }

    if (data.length === 0) {
      console.error(`❌ ${file}: Dataset is empty!`);
      hasErrors = true;
      continue;
    }

    const seenWords = new Set<string>();
    let fileErrors = 0;

    for (let i = 0; i < data.length; i++) {
      const entry = data[i] as WordItem;
      if (!entry.word || typeof entry.word !== "string" || entry.word.trim() === "") {
        console.error(`❌ ${file}[${i}]: Missing or invalid 'word' field`);
        fileErrors++;
      }
      if (!entry.category || typeof entry.category !== "string" || entry.category.trim() === "") {
        console.error(`❌ ${file}[${i}]: Missing or invalid 'category' field`);
        fileErrors++;
      }
      if (!entry.contextClue || typeof entry.contextClue !== "string" || entry.contextClue.trim() === "") {
        console.error(`❌ ${file}[${i}]: Missing or invalid 'contextClue' field`);
        fileErrors++;
      }

      const normalized = (entry.word || "").trim().toLowerCase();
      if (seenWords.has(normalized)) {
        console.warn(`⚠️ ${file}[${i}]: Duplicate word "${entry.word}"`);
        fileErrors++;
      } else {
        seenWords.add(normalized);
      }
    }

    if (fileErrors > 0) {
      console.error(`❌ ${file}: ${fileErrors} errors found.`);
      hasErrors = true;
    } else {
      console.log(`✅ ${file}: ${data.length} valid words.`);
    }

    totalWords += data.length;
  }

  console.log(`\n📊 Total words validated across all datasets: ${totalWords}`);

  if (hasErrors) {
    console.error("❌ Dataset validation failed with errors.");
    process.exit(1);
  } else {
    console.log("🎉 All datasets passed validation perfectly!");
    return true;
  }
}

validateDatasets();
