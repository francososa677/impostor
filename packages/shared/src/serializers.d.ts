import { Player, PublicGameState, PublicRoomState, PlayerPrivateState, RoomSummary, RoomSettings, ScoreBoard } from "./types.js";
export interface InternalGameState {
    phase: PublicGameState["phase"];
    round: number;
    secretWord: string;
    secretCategory: string;
    contextClue: string;
    impostorIds: Set<string>;
    turnOrder: string[];
    currentTurnIndex: number;
    cluesGivenInRound: Set<string>;
    clueHistory: PublicGameState["clueHistory"];
    votes: Map<string, string>;
    tieBreakerCandidateIds?: string[];
    lastEliminatedPlayerId?: string | null;
    lastEliminatedWasImpostor?: boolean | null;
    lastChanceTargetPlayerId?: string | null;
    stats?: PublicGameState["stats"];
}
export interface InternalRoom {
    id: string;
    code: string;
    hostId: string;
    visibility: "public" | "private";
    passwordHash?: string;
    settings: RoomSettings;
    players: Map<string, Player>;
    spectators: Map<string, Player>;
    game: InternalGameState | null;
    scores: ScoreBoard;
    activeMatchCount: number;
    createdAt: number;
}
export declare function toPublicRoomState(room: InternalRoom): PublicRoomState;
export declare function toPlayerPrivateState(room: InternalRoom, playerId: string): PlayerPrivateState;
export declare function toRoomSummary(room: InternalRoom): RoomSummary;
//# sourceMappingURL=serializers.d.ts.map