export function normalizeString(str) {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // strip diacritics / accents
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "") // keep only alphanumeric
        .trim();
}
export function isGuessCorrect(guess, targetWord, aliases) {
    const normGuess = normalizeString(guess);
    if (!normGuess)
        return false;
    const normTarget = normalizeString(targetWord);
    if (normGuess === normTarget)
        return true;
    if (aliases && aliases.length > 0) {
        for (const alias of aliases) {
            if (normGuess === normalizeString(alias))
                return true;
        }
    }
    // Also check if target is multi-word and guess matches main part or vice versa
    return false;
}
//# sourceMappingURL=fuzzy-match.js.map