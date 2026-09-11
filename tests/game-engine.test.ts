import { describe, it, expect, beforeEach } from "vitest";
import {
  GameEngine,
  checkWinConditions,
  isGuessCorrect,
  countVotes,
  updateScoresForRound,
} from "@impostor/game-engine";
import {
  InternalRoom,
  Player,
  RoomSettings,
  WordEntry,
  ScoreBoard,
  toPublicRoomState,
  toPlayerPrivateState,
} from "@impostor/shared";

function createMockRoom(playerCount = 6, impostorCount = 1, settingsOverrides: Partial<RoomSettings> = {}): InternalRoom {
  const players = new Map<string, Player>();
  const scores: ScoreBoard = {};

  for (let i = 1; i <= playerCount; i++) {
    const id = `player-${i}`;
    const player: Player = {
      id,
      nickname: `Player ${i}`,
      avatar: "detective-1",
      isConnected: true,
      isHost: i === 1,
      isEliminated: false,
      isSpectator: false,
      joinedAt: Date.now(),
    };
    players.set(id, player);
    scores[id] = {
      playerId: id,
      nickname: player.nickname,
      avatar: player.avatar,
      wins: 0,
      survivedRounds: 0,
      correctVotes: 0,
      deceivedInnocents: 0,
      lastChanceBonuses: 0,
      totalScore: 0,
    };
  }

  const settings: RoomSettings = {
    mode: "virtual",
    clueDeliveryMode: "oral",
    impostorCount,
    impostorsKnowEachOther: false,
    impostorGetsClue: true,
    clueTypePreference: "context_only",
    selectedCategories: ["objects"],
    clueTimerSeconds: 30,
    discussionTimerSeconds: 60,
    voteTimerSeconds: 45,
    anonymousVoting: true,
    roleRevealMode: "immediate",
    lastChanceGuess: true,
    maxPlayers: 10,
    isPrivate: false,
    ...settingsOverrides,
  };

  return {
    id: "mock-room-id",
    code: "TEST1",
    hostId: "player-1",
    visibility: "public",
    settings,
    players,
    spectators: new Map(),
    game: null,
    scores,
    activeMatchCount: 0,
    createdAt: Date.now(),
  };
}

const mockWordsByCategory = new Map<string, WordEntry[]>([
  [
    "objects",
    [
      { word: "Martillo", category: "Objetos", contextClue: "Construcción", aliases: ["Maza"] },
      { word: "Tijera", category: "Objetos", contextClue: "Costura" },
    ],
  ],
]);

describe("GameEngine Core Rules & Decision Cases", () => {
  it("Case 1: Starts game with 6 players and exactly 1 impostor", () => {
    const room = createMockRoom(6, 1);
    const res = GameEngine.startMatch(room, mockWordsByCategory);

    expect(res.success).toBe(true);
    expect(room.game).not.toBeNull();
    expect(room.game?.impostorIds.size).toBe(1);
    expect(room.game?.turnOrder.length).toBe(6);
    expect(room.game?.phase).toBe("CLUE_PHASE");
    expect(room.game?.round).toBe(1);
  });

  it("Case 2: 8 players with 2 impostors who know each other", () => {
    const room = createMockRoom(8, 2, { impostorsKnowEachOther: true });
    GameEngine.startMatch(room, mockWordsByCategory);

    expect(room.game?.impostorIds.size).toBe(2);
    const impostorList = Array.from(room.game!.impostorIds);

    const privateState1 = toPlayerPrivateState(room, impostorList[0]);
    expect(privateState1.role).toBe("impostor");
    expect(privateState1.impostorTeammates).toBeDefined();
    expect(privateState1.impostorTeammates?.length).toBe(1);
    expect(privateState1.impostorTeammates![0].id).toBe(impostorList[1]);
  });

  it("Case 3: 8 players with 2 impostors who do NOT know each other", () => {
    const room = createMockRoom(8, 2, { impostorsKnowEachOther: false });
    GameEngine.startMatch(room, mockWordsByCategory);

    const impostorList = Array.from(room.game!.impostorIds);
    const privateState = toPlayerPrivateState(room, impostorList[0]);
    expect(privateState.impostorTeammates).toBeUndefined();
  });

  it("Case 4: Discovered Impostor and successful Last Chance Guess (Impostors Win)", () => {
    const room = createMockRoom(6, 1, { lastChanceGuess: true });
    GameEngine.startMatch(room, mockWordsByCategory);

    const impostorId = Array.from(room.game!.impostorIds)[0];
    const aliveInnocents = Array.from(room.players.values()).filter((p) => p.id !== impostorId);

    // Set phase to VOTING
    room.game!.phase = "VOTING";

    // All innocents vote for impostor
    for (const innocent of aliveInnocents) {
      GameEngine.submitVote(room, innocent.id, impostorId);
    }

    const voteOutcome = GameEngine.resolveVoting(room);
    expect(voteOutcome.phase).toBe("LAST_CHANCE");
    expect(room.game?.phase).toBe("LAST_CHANCE");

    // Impostor guesses secret word correctly
    const guessRes = GameEngine.handleLastChanceGuess(room, impostorId, room.game!.secretWord);
    expect(guessRes.success).toBe(true);
    expect(guessRes.isCorrect).toBe(true);
    expect(guessRes.isGameOver).toBe(true);
    expect(room.game?.phase).toBe("GAME_OVER");
    expect(room.game?.stats?.winner).toBe("impostors");
  });

  it("Case 5: Discovered Impostor and incorrect Last Chance Guess (Innocents Win)", () => {
    const room = createMockRoom(6, 1, { lastChanceGuess: true });
    GameEngine.startMatch(room, mockWordsByCategory);

    const impostorId = Array.from(room.game!.impostorIds)[0];
    const aliveInnocents = Array.from(room.players.values()).filter((p) => p.id !== impostorId);

    room.game!.phase = "VOTING";

    for (const innocent of aliveInnocents) {
      GameEngine.submitVote(room, innocent.id, impostorId);
    }

    GameEngine.resolveVoting(room);

    // Impostor guesses incorrectly
    const guessRes = GameEngine.handleLastChanceGuess(room, impostorId, "PalabraInventada123");
    expect(guessRes.isCorrect).toBe(false);
    expect(guessRes.isGameOver).toBe(true);
    expect(room.game?.phase).toBe("GAME_OVER");
    expect(room.game?.stats?.winner).toBe("innocents");
  });

  it("Case 6: Voting Tie triggers TIE_BREAKER phase with only tied candidates", () => {
    const room = createMockRoom(6, 1);
    GameEngine.startMatch(room, mockWordsByCategory);

    room.game!.phase = "VOTING";

    // 2 votes for player-1, 2 votes for player-2
    GameEngine.submitVote(room, "player-3", "player-1");
    GameEngine.submitVote(room, "player-4", "player-1");
    GameEngine.submitVote(room, "player-5", "player-2");
    GameEngine.submitVote(room, "player-6", "player-2");

    const res = GameEngine.resolveVoting(room);
    expect(res.phase).toBe("TIE_BREAKER");
    expect(room.game?.phase).toBe("TIE_BREAKER");
    expect(room.game?.tieBreakerCandidateIds).toEqual(["player-1", "player-2"]);
  });

  it("Case 7: Second tie in Tie-Breaker eliminates nobody and advances to next round", () => {
    const room = createMockRoom(6, 1);
    GameEngine.startMatch(room, mockWordsByCategory);

    room.game!.phase = "VOTING";

    // First tie
    GameEngine.submitVote(room, "player-3", "player-1");
    GameEngine.submitVote(room, "player-4", "player-1");
    GameEngine.submitVote(room, "player-5", "player-2");
    GameEngine.submitVote(room, "player-6", "player-2");
    GameEngine.resolveVoting(room);

    // Second tie in TIE_BREAKER
    GameEngine.submitVote(room, "player-3", "player-1");
    GameEngine.submitVote(room, "player-4", "player-2");
    const secondRes = GameEngine.resolveVoting(room);

    expect(secondRes.phase).toBe("CLUE_PHASE");
    expect(room.game?.round).toBe(2);
    expect(secondRes.eliminatedPlayerId).toBeNull();
  });

  it("Case 8: Fuzzy match normalizes accents, uppercase, and punctuation", () => {
    expect(isGuessCorrect("martillo", "Martillo")).toBe(true);
    expect(isGuessCorrect("  MÁRTÍLLÓ! ", "Martillo")).toBe(true);
    expect(isGuessCorrect("Maza", "Martillo", ["Maza"])).toBe(true);
    expect(isGuessCorrect("Destornillador", "Martillo")).toBe(false);
  });

  it("Case 9: Win condition: Impostors >= Innocents => Impostors Win", () => {
    const room = createMockRoom(4, 2); // 2 impostors, 2 innocents
    const impostorIds = new Set(["player-1", "player-2"]);
    const winResult = checkWinConditions(room.players, impostorIds);

    expect(winResult.isGameOver).toBe(true);
    expect(winResult.winner).toBe("impostors");
  });

  it("Case 10: Rematch preserves players and scores unless reset requested", () => {
    const room = createMockRoom(6, 1);
    GameEngine.startMatch(room, mockWordsByCategory);

    // Add some score
    room.scores["player-1"].totalScore = 150;

    // Rematch keeping scores
    GameEngine.rematch(room, mockWordsByCategory, false);
    expect(room.scores["player-1"].totalScore).toBe(150);
    expect(room.activeMatchCount).toBe(2);

    // Rematch resetting scores
    GameEngine.rematch(room, mockWordsByCategory, true);
    expect(room.scores["player-1"].totalScore).toBe(0);
    expect(room.activeMatchCount).toBe(3);
  });
});
