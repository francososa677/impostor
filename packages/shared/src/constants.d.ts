export declare const GAME_LIMITS: {
    readonly MIN_PLAYERS: 3;
    readonly MAX_PLAYERS: 20;
    readonly MIN_NICKNAME_LENGTH: 2;
    readonly MAX_NICKNAME_LENGTH: 20;
    readonly MIN_ROOM_NAME_LENGTH: 3;
    readonly MAX_ROOM_NAME_LENGTH: 30;
    readonly MAX_CHAT_MESSAGE_LENGTH: 200;
    readonly MAX_CLUE_LENGTH: 100;
    readonly MAX_GUESS_LENGTH: 100;
    readonly RECONNECT_GRACE_PERIOD_MS: 30000;
    readonly LOBBY_DISCONNECT_GRACE_MS: 5000;
    readonly ROOM_CODE_LENGTH: 5;
};
export declare const SCORING_RULES: {
    readonly INNOCENT_WIN: 100;
    readonly INNOCENT_SURVIVED_ROUND: 20;
    readonly INNOCENT_CORRECT_VOTE: 30;
    readonly IMPOSTOR_WIN: 150;
    readonly IMPOSTOR_SURVIVED_ROUND: 30;
    readonly IMPOSTOR_DECEIVED_VOTE: 25;
    readonly IMPOSTOR_LAST_CHANCE_SUCCESS: 120;
};
export declare const CHAT_REACTIONS: readonly ["😂", "😱", "👀", "🤨", "🔥"];
export declare const AVATAR_LIST: readonly ["detective-1", "detective-2", "shadow-1", "shadow-2", "spy-1", "spy-2", "mask-1", "mask-2", "hood-1", "hood-2", "raven-1", "wolf-1"];
export declare const DEFAULT_CATEGORIES: readonly [{
    readonly id: "objects";
    readonly name: "Objetos";
    readonly description: "Cosas cotidianas y herramientas";
}, {
    readonly id: "food";
    readonly name: "Comida";
    readonly description: "Platos, ingredientes y bebidas del mundo";
}, {
    readonly id: "football_players";
    readonly name: "Jugadores de Fútbol";
    readonly description: "Estrellas históricas y actuales";
}, {
    readonly id: "movies";
    readonly name: "Películas";
    readonly description: "Clásicos del cine y blockbusters";
}, {
    readonly id: "series";
    readonly name: "Series";
    readonly description: "Series memorables y de culto";
}, {
    readonly id: "videogames";
    readonly name: "Videojuegos";
    readonly description: "Títulos legendarios y modernos";
}];
export declare function getMaxImpostorsForPlayerCount(playerCount: number): number;
//# sourceMappingURL=constants.d.ts.map