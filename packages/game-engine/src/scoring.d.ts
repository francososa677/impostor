import { ScoreBoard, Player } from "@impostor/shared";
export declare function initializeScoreBoard(players: Player[]): ScoreBoard;
export declare function updateScoresForRound(currentScores: ScoreBoard, players: Map<string, Player>, impostorIds: Set<string>, votes: Map<string, string>, eliminatedId: string | null, winner: "innocents" | "impostors" | null, lastChanceBonusPlayerId?: string | null): ScoreBoard;
//# sourceMappingURL=scoring.d.ts.map