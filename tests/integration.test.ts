import { describe, it, expect } from "vitest";
import { InMemoryRoomStore } from "../apps/server/src/store/room-store.js";
import { GameEngine } from "@impostor/game-engine";
import { WordEntry, Player, RoomSettings } from "@impostor/shared";

const mockWordsByCategory = new Map<string, WordEntry[]>([
  ["objects", [{ word: "Martillo", category: "Objetos", contextClue: "Construcción" }]],
  ["food", [{ word: "Pizza", category: "Comida", contextClue: "Horno" }]],
]);

describe("Multi-Room Concurrency & Isolation Integration", () => {
  it("Manages multiple simultaneous rooms with independent states and words", () => {
    const store = new InMemoryRoomStore();

    // Create Room A
    const hostA: Player = {
      id: "host-a",
      nickname: "Host A",
      avatar: "detective-1",
      isConnected: true,
      isHost: true,
      isEliminated: false,
      isSpectator: false,
      joinedAt: 1,
    };
    const settingsA: RoomSettings = {
      mode: "virtual",
      clueDeliveryMode: "oral",
      impostorCount: 1,
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
      maxPlayers: 8,
      isPrivate: false,
    };
    const roomA = store.createRoom(hostA, settingsA);

    // Add players to Room A
    for (let i = 2; i <= 4; i++) {
      roomA.players.set(`player-a-${i}`, {
        id: `player-a-${i}`,
        nickname: `Player A${i}`,
        avatar: "detective-2",
        isConnected: true,
        isHost: false,
        isEliminated: false,
        isSpectator: false,
        joinedAt: i,
      });
    }

    // Create Room B
    const hostB: Player = {
      id: "host-b",
      nickname: "Host B",
      avatar: "shadow-1",
      isConnected: true,
      isHost: true,
      isEliminated: false,
      isSpectator: false,
      joinedAt: 1,
    };
    const settingsB: RoomSettings = {
      ...settingsA,
      selectedCategories: ["food"],
      impostorCount: 1,
    };
    const roomB = store.createRoom(hostB, settingsB);

    for (let i = 2; i <= 4; i++) {
      roomB.players.set(`player-b-${i}`, {
        id: `player-b-${i}`,
        nickname: `Player B${i}`,
        avatar: "spy-1",
        isConnected: true,
        isHost: false,
        isEliminated: false,
        isSpectator: false,
        joinedAt: i,
      });
    }

    expect(store.getRoomCount()).toBe(2);

    // Start match in Room A (Objects)
    GameEngine.startMatch(roomA, mockWordsByCategory);
    expect(roomA.game).not.toBeNull();
    expect(roomA.game?.secretCategory).toBe("Objetos");
    expect(roomA.game?.secretWord).toBe("Martillo");

    // Start match in Room B (Food)
    GameEngine.startMatch(roomB, mockWordsByCategory);
    expect(roomB.game).not.toBeNull();
    expect(roomB.game?.secretCategory).toBe("Comida");
    expect(roomB.game?.secretWord).toBe("Pizza");

    // Room A submits clue, Room B remains at turn 0
    const turn1A = roomA.game!.turnOrder[roomA.game!.currentTurnIndex];
    GameEngine.submitClue(roomA, turn1A, "Pista de prueba A");
    expect(roomA.game!.cluesGivenInRound.size).toBe(1);
    expect(roomB.game!.cluesGivenInRound.size).toBe(0);

    // Verify isolation
    expect(roomA.code).not.toBe(roomB.code);
    expect(roomA.id).not.toBe(roomB.id);
  });
});
