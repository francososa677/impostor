import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WordEntry } from "@impostor/shared";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getWordsDir(): string {
  const candidates = [
    path.resolve(process.cwd(), "data/words"),
    path.resolve(process.cwd(), "../../data/words"),
    path.resolve(__dirname, "../../../../data/words"),
    path.resolve(__dirname, "../../../data/words"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return candidates[0];
}

const WORDS_DIR = getWordsDir();

export class WordDataLoader {
  private static wordsByCategory = new Map<string, WordEntry[]>();
  private static categoriesMeta: { id: string; name: string; count: number }[] = [];

  public static loadAll(): Map<string, WordEntry[]> {
    this.wordsByCategory.clear();
    this.categoriesMeta = [];

    if (!fs.existsSync(WORDS_DIR)) {
      console.warn(`[DataLoader] Words directory not found at ${WORDS_DIR}`);
      return this.wordsByCategory;
    }

    const files = fs.readdirSync(WORDS_DIR).filter((f) => f.endsWith(".json"));

    for (const file of files) {
      try {
        const categoryId = path.basename(file, ".json");
        const fullPath = path.join(WORDS_DIR, file);
        const raw = fs.readFileSync(fullPath, "utf-8");
        const entries: WordEntry[] = JSON.parse(raw);

        if (Array.isArray(entries) && entries.length > 0) {
          this.wordsByCategory.set(categoryId, entries);
          const displayName = entries[0].category || categoryId;
          this.categoriesMeta.push({
            id: categoryId,
            name: displayName,
            count: entries.length,
          });
        }
      } catch (err) {
        console.error(`[DataLoader] Failed to load word file ${file}:`, err);
      }
    }

    console.log(
      `[DataLoader] Loaded ${this.wordsByCategory.size} categories with total words:`
    );
    for (const cat of this.categoriesMeta) {
      console.log(`  - ${cat.name} (${cat.id}): ${cat.count} words`);
    }

    return this.wordsByCategory;
  }

  public static getWordsByCategory(): Map<string, WordEntry[]> {
    if (this.wordsByCategory.size === 0) {
      return this.loadAll();
    }
    return this.wordsByCategory;
  }

  public static getCategoriesMeta() {
    if (this.categoriesMeta.length === 0) {
      this.loadAll();
    }
    return this.categoriesMeta;
  }
}
