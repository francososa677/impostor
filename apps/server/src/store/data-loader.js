import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORDS_DIR = path.resolve(__dirname, "../../../data/words");
export class WordDataLoader {
    static wordsByCategory = new Map();
    static categoriesMeta = [];
    static loadAll() {
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
                const entries = JSON.parse(raw);
                if (Array.isArray(entries) && entries.length > 0) {
                    this.wordsByCategory.set(categoryId, entries);
                    const displayName = entries[0].category || categoryId;
                    this.categoriesMeta.push({
                        id: categoryId,
                        name: displayName,
                        count: entries.length,
                    });
                }
            }
            catch (err) {
                console.error(`[DataLoader] Failed to load word file ${file}:`, err);
            }
        }
        console.log(`[DataLoader] Loaded ${this.wordsByCategory.size} categories with total words:`);
        for (const cat of this.categoriesMeta) {
            console.log(`  - ${cat.name} (${cat.id}): ${cat.count} words`);
        }
        return this.wordsByCategory;
    }
    static getWordsByCategory() {
        if (this.wordsByCategory.size === 0) {
            return this.loadAll();
        }
        return this.wordsByCategory;
    }
    static getCategoriesMeta() {
        if (this.categoriesMeta.length === 0) {
            this.loadAll();
        }
        return this.categoriesMeta;
    }
}
//# sourceMappingURL=data-loader.js.map