import { WordEntry } from "@impostor/shared";
export declare class WordDataLoader {
    private static wordsByCategory;
    private static categoriesMeta;
    static loadAll(): Map<string, WordEntry[]>;
    static getWordsByCategory(): Map<string, WordEntry[]>;
    static getCategoriesMeta(): {
        id: string;
        name: string;
        count: number;
    }[];
}
//# sourceMappingURL=data-loader.d.ts.map