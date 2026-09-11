import crypto from "node:crypto";
import {
  InternalRoom,
  RoomSettings,
  Player,
  RoomSummary,
  toRoomSummary,
  GAME_LIMITS,
} from "@impostor/shared";
import { config } from "../config.js";

// Clean alphabet excluding ambiguous characters: 0, O, 1, I, L
const ROOM_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export interface RoomStore {
  createRoom(hostPlayer: Player, settings: RoomSettings, passwordHash?: string): InternalRoom;
  getRoomByCode(code: string): InternalRoom | undefined;
  getRoomById(id: string): InternalRoom | undefined;
  deleteRoom(id: string): boolean;
  listPublicRooms(): RoomSummary[];
  createSessionToken(playerId: string, roomCode: string): string;
  verifySessionToken(token: string, playerId: string, roomCode: string): boolean;
  getRoomCount(): number;
}

export class InMemoryRoomStore implements RoomStore {
  private roomsById = new Map<string, InternalRoom>();
  private roomsByCode = new Map<string, InternalRoom>();
  private socketToPlayer = new Map<string, { playerId: string; roomCode: string }>();

  public generateRoomCode(): string {
    let code = "";
    let attempts = 0;
    do {
      code = "";
      for (let i = 0; i < GAME_LIMITS.ROOM_CODE_LENGTH; i++) {
        const randomIndex = crypto.randomInt(0, ROOM_CODE_ALPHABET.length);
        code += ROOM_CODE_ALPHABET[randomIndex];
      }
      attempts++;
    } while (this.roomsByCode.has(code) && attempts < 100);

    return code;
  }

  public createRoom(
    hostPlayer: Player,
    settings: RoomSettings,
    passwordHash?: string
  ): InternalRoom {
    const id = crypto.randomUUID();
    const code = this.generateRoomCode();

    const room: InternalRoom = {
      id,
      code,
      hostId: hostPlayer.id,
      visibility: settings.isPrivate ? "private" : "public",
      passwordHash,
      settings,
      players: new Map([[hostPlayer.id, hostPlayer]]),
      spectators: new Map(),
      game: null,
      scores: {
        [hostPlayer.id]: {
          playerId: hostPlayer.id,
          nickname: hostPlayer.nickname,
          avatar: hostPlayer.avatar,
          wins: 0,
          survivedRounds: 0,
          correctVotes: 0,
          deceivedInnocents: 0,
          lastChanceBonuses: 0,
          totalScore: 0,
        },
      },
      activeMatchCount: 0,
      createdAt: Date.now(),
    };

    this.roomsById.set(id, room);
    this.roomsByCode.set(code, room);
    return room;
  }

  public getRoomByCode(code: string): InternalRoom | undefined {
    return this.roomsByCode.get(code.toUpperCase().trim());
  }

  public getRoomById(id: string): InternalRoom | undefined {
    return this.roomsById.get(id);
  }

  public deleteRoom(id: string): boolean {
    const room = this.roomsById.get(id);
    if (!room) return false;

    this.roomsByCode.delete(room.code);
    this.roomsById.delete(id);
    return true;
  }

  public listPublicRooms(): RoomSummary[] {
    const summaries: RoomSummary[] = [];
    for (const room of this.roomsById.values()) {
      if (room.visibility === "public") {
        summaries.push(toRoomSummary(room));
      }
    }
    return summaries;
  }

  public createSessionToken(playerId: string, roomCode: string): string {
    const payload = `${playerId}:${roomCode}:${Date.now()}`;
    const hmac = crypto
      .createHmac("sha256", config.SESSION_SECRET)
      .update(payload)
      .digest("hex");
    return Buffer.from(`${payload}:${hmac}`).toString("base64url");
  }

  public verifySessionToken(token: string, playerId: string, roomCode: string): boolean {
    try {
      const decoded = Buffer.from(token, "base64url").toString("utf-8");
      const parts = decoded.split(":");
      if (parts.length !== 4) return false;

      const [tokenPlayerId, tokenRoomCode, timestamp, tokenHmac] = parts;
      if (tokenPlayerId !== playerId || tokenRoomCode !== roomCode) return false;

      const expectedHmac = crypto
        .createHmac("sha256", config.SESSION_SECRET)
        .update(`${tokenPlayerId}:${tokenRoomCode}:${timestamp}`)
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(tokenHmac, "hex"),
        Buffer.from(expectedHmac, "hex")
      );
    } catch {
      return false;
    }
  }

  public getRoomCount(): number {
    return this.roomsById.size;
  }

  public registerSocket(socketId: string, playerId: string, roomCode: string) {
    this.socketToPlayer.set(socketId, { playerId, roomCode });
  }

  public unregisterSocket(socketId: string) {
    this.socketToPlayer.delete(socketId);
  }

  public getPlayerBySocket(socketId: string) {
    return this.socketToPlayer.get(socketId);
  }
}

export const globalRoomStore = new InMemoryRoomStore();
