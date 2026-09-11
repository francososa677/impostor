"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_url_1 = require("node:url");
const __filename = (0, node_url_1.fileURLToPath)(import.meta.url);
const __dirname = node_path_1.default.dirname(__filename);
const WORDS_DIR = node_path_1.default.resolve(__dirname, "../data/words");
function validateDatasets() {
    console.log("🔍 Validating datasets in:", WORDS_DIR);
    if (!node_fs_1.default.existsSync(WORDS_DIR)) {
        console.error("❌ Words directory does not exist:", WORDS_DIR);
        process.exit(1);
    }
    const files = node_fs_1.default.readdirSync(WORDS_DIR).filter((f) => f.endsWith(".json"));
    if (files.length === 0) {
        console.error("❌ No JSON files found in words directory!");
        process.exit(1);
    }
    let totalWords = 0;
    let hasErrors = false;
    for (const file of files) {
        const filePath = node_path_1.default.join(WORDS_DIR, file);
        const content = node_fs_1.default.readFileSync(filePath, "utf-8");
        let data;
        try {
            data = JSON.parse(content);
        }
        catch (err) {
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
        const seenWords = new Set();
        let fileErrors = 0;
        for (let i = 0; i < data.length; i++) {
            const entry = data[i];
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
            }
            else {
                seenWords.add(normalized);
            }
        }
        if (fileErrors > 0) {
            console.error(`❌ ${file}: ${fileErrors} errors found.`);
            hasErrors = true;
        }
        else {
            console.log(`✅ ${file}: ${data.length} valid words.`);
        }
        totalWords += data.length;
    }
    console.log(`\n📊 Total words validated across all datasets: ${totalWords}`);
    if (hasErrors) {
        console.error("❌ Dataset validation failed with errors.");
        process.exit(1);
    }
    else {
        console.log("🎉 All datasets passed validation perfectly!");
        return true;
    }
}
validateDatasets();
//# sourceMappingURL=validate-data.js.map