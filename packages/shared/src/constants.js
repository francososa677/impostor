export const GAME_LIMITS = {
    MIN_PLAYERS: 3,
    MAX_PLAYERS: 20,
    MIN_NICKNAME_LENGTH: 2,
    MAX_NICKNAME_LENGTH: 20,
    MIN_ROOM_NAME_LENGTH: 3,
    MAX_ROOM_NAME_LENGTH: 30,
    MAX_CHAT_MESSAGE_LENGTH: 200,
    MAX_CLUE_LENGTH: 100,
    MAX_GUESS_LENGTH: 100,
    RECONNECT_GRACE_PERIOD_MS: 30000,
    LOBBY_DISCONNECT_GRACE_MS: 5000,
    ROOM_CODE_LENGTH: 5,
};
export const SCORING_RULES = {
    INNOCENT_WIN: 100,
    INNOCENT_SURVIVED_ROUND: 20,
    INNOCENT_CORRECT_VOTE: 30,
    IMPOSTOR_WIN: 150,
    IMPOSTOR_SURVIVED_ROUND: 30,
    IMPOSTOR_DECEIVED_VOTE: 25,
    IMPOSTOR_LAST_CHANCE_SUCCESS: 120,
};
export const CHAT_REACTIONS = ["😂", "😱", "👀", "🤨", "🔥"];
export const AVATAR_LIST = [
    "detective-1",
    "detective-2",
    "shadow-1",
    "shadow-2",
    "spy-1",
    "spy-2",
    "mask-1",
    "mask-2",
    "hood-1",
    "hood-2",
    "raven-1",
    "wolf-1",
];
export const DEFAULT_CATEGORIES = [
    { id: "objects", name: "Objetos", description: "Cosas cotidianas y herramientas" },
    { id: "food", name: "Comida", description: "Platos, ingredientes y bebidas del mundo" },
    { id: "football_players", name: "Jugadores de Fútbol", description: "Estrellas históricas y actuales" },
    { id: "movies", name: "Películas", description: "Clásicos del cine y blockbusters" },
    { id: "series", name: "Series", description: "Series memorables y de culto" },
    { id: "videogames", name: "Videojuegos", description: "Títulos legendarios y modernos" },
];
export function getMaxImpostorsForPlayerCount(playerCount) {
    if (playerCount < 3)
        return 1;
    if (playerCount <= 5)
        return 1;
    if (playerCount <= 7)
        return 2;
    if (playerCount <= 10)
        return 3;
    if (playerCount <= 14)
        return 4;
    return Math.min(5, Math.floor((playerCount - 1) / 2));
}
//# sourceMappingURL=constants.js.map