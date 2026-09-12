import { WordEntry } from "@impostor/shared";
import foodWords from "../../../../data/words/food.json";
import footballWords from "../../../../data/words/football_players.json";
import moviesWords from "../../../../data/words/movies.json";
import objectsWords from "../../../../data/words/objects.json";
import seriesWords from "../../../../data/words/series.json";
import videogamesWords from "../../../../data/words/videogames.json";

export const LOCAL_WORDS_BY_CATEGORY: Record<string, WordEntry[]> = {
  food: foodWords as WordEntry[],
  football_players: footballWords as WordEntry[],
  movies: moviesWords as WordEntry[],
  objects: objectsWords as WordEntry[],
  series: seriesWords as WordEntry[],
  videogames: videogamesWords as WordEntry[],
};

export function getRandomElement<T>(array: T[]): T {
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}

export function pickNewSecretWord(
  selectedCategoryIds: string[],
  currentWord?: string
): { word: string; category: string; contextClue: string } {
  const availableCats = selectedCategoryIds.filter(
    (id) => LOCAL_WORDS_BY_CATEGORY[id] && LOCAL_WORDS_BY_CATEGORY[id].length > 0
  );

  const chosenCatId =
    availableCats.length > 0 ? getRandomElement(availableCats) : "objects";
  const pool = LOCAL_WORDS_BY_CATEGORY[chosenCatId] || (objectsWords as WordEntry[]);

  const filtered = currentWord
    ? pool.filter((w) => w.word.toLowerCase() !== currentWord.toLowerCase())
    : pool;

  const candidate = filtered.length > 0 ? getRandomElement(filtered) : getRandomElement(pool);
  return candidate;
}
