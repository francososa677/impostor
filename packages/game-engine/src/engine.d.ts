import { WordEntry, InternalGameState, InternalRoom } from "@impostor/shared";
export interface GameEngineInitOptions {
    room: InternalRoom;
    wordsByCategory: Map<string, WordEntry[]>;
}
export declare class GameEngine {
    /**
     * Initializes a brand new game match inside a room
     */
    static startMatch(room: InternalRoom, wordsByCategory: Map<string, WordEntry[]>): {
        success: boolean;
        error?: string;
    };
    /**
     * Submits a clue during CLUE_PHASE
     */
    static submitClue(room: InternalRoom, playerId: string, clueText: string): {
        success: boolean;
        advanceToPhase?: string;
        error?: string;
    };
    /**
     * Advances the turn to the next alive player or transitions to discussion/voting
     */
    static advanceTurn(room: InternalRoom): {
        success: boolean;
        advanceToPhase?: string;
        error?: string;
    };
    /**
     * Transition from discussion to voting
     */
    static startVoting(room: InternalRoom): {
        success: boolean;
    };
    /**
     * Submits a vote
     */
    static submitVote(room: InternalRoom, voterId: string, targetId: string): {
        success: boolean;
        allVoted?: boolean;
        error?: string;
    };
    /**
     * Resolves the voting outcome
     */
    static resolveVoting(room: InternalRoom): {
        phase: InternalGameState["phase"];
        eliminatedPlayerId?: string | null;
        isTie?: boolean;
        isGameOver?: boolean;
    };
    /**
     * Handles impostor's guess in the Last Chance phase
     */
    static handleLastChanceGuess(room: InternalRoom, playerId: string, guessText: string): {
        success: boolean;
        isCorrect: boolean;
        isGameOver: boolean;
    };
    /**
     * Finalizes elimination, calculates round scores, and checks for win conditions
     */
    static finishEliminationAndCheckWin(room: InternalRoom, eliminatedId: string): {
        phase: InternalGameState["phase"];
        isGameOver: boolean;
        winner?: string;
    };
    /**
     * Starts next round
     */
    static startNextRound(room: InternalRoom): void;
    /**
     * Rematch: preserves players, room code, and scores (optionally reset) (Decision 105)
     */
    static rematch(room: InternalRoom, wordsByCategory: Map<string, WordEntry[]>, resetScores?: boolean): {
        success: boolean;
        error?: string;
    };
}
//# sourceMappingURL=engine.d.ts.map