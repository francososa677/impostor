import { describe, it, expect } from "vitest";
import {
  createRoomSchema,
  joinRoomSchema,
  submitClueSchema,
  toPublicRoomState,
  toPlayerPrivateState,
  InternalRoom,
  Player,
} from "@impostor/shared";
import { InMemoryRoomStore } from "../apps/server/src/store/room-store.js";

describe("Security & OWASP Validations", () => {
  it("Sanitizes HTML and script tags from nicknames and clues", () => {
    const maliciousNickname = "<script>bad()</script><b>Franco</b>";
    const res = createRoomSchema.safeParse({
      nickname: maliciousNickname,
      selectedCategories: ["objects"],
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.nickname).not.toContain("<script>");
      expect(res.data.nickname).not.toContain("<b>");
      expect(res.data.nickname).toBe("bad()Franco");
    }
  });

  it("Rejects empty or excessively long inputs", () => {
    const emptyRes = createRoomSchema.safeParse({
      nickname: "",
      selectedCategories: ["objects"],
    });
    expect(emptyRes.success).toBe(false);

    const longRes = createRoomSchema.safeParse({
      nickname: "A".repeat(50),
      selectedCategories: ["objects"],
    });
    expect(longRes.success).toBe(false);
  });

  it("Ensures PublicRoomState NEVER leaks secret word or impostor identities", () => {
    const mockRoom: InternalRoom = {
      id: "room-sec-1",
      code: "SEC01",
      hostId: "p-host",
      visibility: "public",
      settings: {
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
      },
      players: new Map([
        ["p-host", { id: "p-host", nickname: "Host", avatar: "detective-1", isConnected: true, isHost: true, isEliminated: false, isSpectator: false, joinedAt: 1 }],
        ["p-impostor", { id: "p-impostor", nickname: "Spy", avatar: "shadow-1", isConnected: true, isHost: false, isEliminated: false, isSpectator: false, joinedAt: 2 }],
      ]),
      spectators: new Map(),
      game: {
        phase: "CLUE_PHASE",
        round: 1,
        secretWord: "TOP_SECRET_WORD_12345",
        secretCategory: "Objetos",
        contextClue: "Construcción",
        impostorIds: new Set(["p-impostor"]),
        turnOrder: ["p-host", "p-impostor"],
        currentTurnIndex: 0,
        cluesGivenInRound: new Set(),
        clueHistory: [],
        votes: new Map(),
      },
      scores: {},
      activeMatchCount: 1,
      createdAt: Date.now(),
    };

    const publicState = toPublicRoomState(mockRoom);
    const serializedJson = JSON.stringify(publicState);

    expect(serializedJson).not.toContain("TOP_SECRET_WORD_12345");
    expect(serializedJson).not.toContain("impostorIds");
  });

  it("Ensures PlayerPrivateState gives word only to innocent and never to impostor", () => {
    const mockRoom: InternalRoom = {
      id: "room-sec-2",
      code: "SEC02",
      hostId: "p-innocent",
      visibility: "public",
      settings: {
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
      },
      players: new Map([
        ["p-innocent", { id: "p-innocent", nickname: "Innocent", avatar: "detective-1", isConnected: true, isHost: true, isEliminated: false, isSpectator: false, joinedAt: 1 }],
        ["p-impostor", { id: "p-impostor", nickname: "Spy", avatar: "shadow-1", isConnected: true, isHost: false, isEliminated: false, isSpectator: false, joinedAt: 2 }],
      ]),
      spectators: new Map(),
      game: {
        phase: "CLUE_PHASE",
        round: 1,
        secretWord: "SECRET_PASSWORD_WORD",
        secretCategory: "Objetos",
        contextClue: "Herramienta",
        impostorIds: new Set(["p-impostor"]),
        turnOrder: ["p-innocent", "p-impostor"],
        currentTurnIndex: 0,
        cluesGivenInRound: new Set(),
        clueHistory: [],
        votes: new Map(),
      },
      scores: {},
      activeMatchCount: 1,
      createdAt: Date.now(),
    };

    const innocentState = toPlayerPrivateState(mockRoom, "p-innocent");
    expect(innocentState.role).toBe("innocent");
    expect(innocentState.secretWord).toBe("SECRET_PASSWORD_WORD");

    const impostorState = toPlayerPrivateState(mockRoom, "p-impostor");
    expect(impostorState.role).toBe("impostor");
    expect(impostorState.secretWord).toBeUndefined();
    expect(impostorState.contextClue).toBe("Herramienta");
  });

  it("Generates and verifies cryptographic session tokens to prevent impersonation", () => {
    const store = new InMemoryRoomStore();
    const token = store.createSessionToken("player-abc", "ROOM1");

    expect(store.verifySessionToken(token, "player-abc", "ROOM1")).toBe(true);
    expect(store.verifySessionToken(token, "player-forged", "ROOM1")).toBe(false);
    expect(store.verifySessionToken(token, "player-abc", "WRONG_ROOM")).toBe(false);
    expect(store.verifySessionToken("tampered-token", "player-abc", "ROOM1")).toBe(false);
  });
});
