import { Player, RoomSettings } from "@impostor/shared";
export interface WinCheckResult {
    isGameOver: boolean;
    winner: "innocents" | "impostors" | null;
    winReason: string;
}
export declare function validateCanStartGame(players: Player[], settings: RoomSettings, availableCategories: string[]): {
    valid: boolean;
    error?: string;
};
export declare function checkWinConditions(players: Map<string, Player>, impostorIds: Set<string>): WinCheckResult;
export declare function countVotes(votes: Map<string, string>, candidateFilter?: string[]): {
    voteCounts: Map<string, number>;
    maxVotes: number;
    topCandidateIds: string[];
};
//# sourceMappingURL=rules.d.ts.map