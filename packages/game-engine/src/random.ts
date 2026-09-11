// Cryptographically secure randomness for game engine decisions
export function getRandomInt(min: number, max: number): number {
  if (min > max) throw new Error("min cannot be greater than max");
  if (min === max) return min;

  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8) || 1;
  const cutoff = Math.floor((256 ** bytesNeeded) / range) * range;
  const bytes = new Uint8Array(bytesNeeded);

  let value: number;
  do {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      // Fallback if needed
      for (let i = 0; i < bytesNeeded; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    value = 0;
    for (let i = 0; i < bytesNeeded; i++) {
      value = (value << 8) + bytes[i];
    }
  } while (value >= cutoff);

  return min + (value % range);
}

export function pickRandom<T>(array: readonly T[] | T[]): T {
  if (array.length === 0) throw new Error("Cannot pick from empty array");
  const index = getRandomInt(0, array.length - 1);
  return array[index];
}

export function shuffleArray<T>(array: readonly T[] | T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = getRandomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
