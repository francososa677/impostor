import crypto from "node:crypto";
import { toRoomSummary, GAME_LIMITS, } from "@impostor/shared";
import { config } from "../config.js";
// Clean alphabet excluding ambiguous characters: 0, O, 1, I, L
const ROOM_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export class InMemoryRoomStore {
    roomsById = new Map();
    roomsByCode = new Map();
    socketToPlayer = new Map();
    generateRoomCode() {
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
    createRoom(hostPlayer, settings, passwordHash) {
        const id = crypto.randomUUID();
        const code = this.generateRoomCode();
        const room = {
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
    getRoomByCode(code) {
        return this.roomsByCode.get(code.toUpperCase().trim());
    }
    getRoomById(id) {
        return this.roomsById.get(id);
    }
    deleteRoom(id) {
        const room = this.roomsById.get(id);
        if (!room)
            return false;
        this.roomsByCode.delete(room.code);
        this.roomsById.delete(id);
        return true;
    }
    listPublicRooms() {
        const summaries = [];
        for (const room of this.roomsById.values()) {
            if (room.visibility === "public") {
                summaries.push(toRoomSummary(room));
            }
        }
        return summaries;
    }
    createSessionToken(playerId, roomCode) {
        const payload = `${playerId}:${roomCode}:${Date.now()}`;
        const hmac = crypto
            .createHmac("sha256", config.SESSION_SECRET)
            .update(payload)
            .digest("hex");
        return Buffer.from(`${payload}:${hmac}`).toString("base64url");
    }
    verifySessionToken(token, playerId, roomCode) {
        try {
            const decoded = Buffer.from(token, "base64url").toString("utf-8");
            const parts = decoded.split(":");
            if (parts.length !== 4)
                return false;
            const [tokenPlayerId, tokenRoomCode, timestamp, tokenHmac] = parts;
            if (tokenPlayerId !== playerId || tokenRoomCode !== roomCode)
                return false;
            const expectedHmac = crypto
                .createHmac("sha256", config.SESSION_SECRET)
                .update(`${tokenPlayerId}:${tokenRoomCode}:${timestamp}`)
                .digest("hex");
            return crypto.timingSafeEqual(Buffer.from(tokenHmac, "hex"), Buffer.from(expectedHmac, "hex"));
        }
        catch {
            return false;
        }
    }
    getRoomCount() {
        return this.roomsById.size;
    }
    registerSocket(socketId, playerId, roomCode) {
        this.socketToPlayer.set(socketId, { playerId, roomCode });
    }
    unregisterSocket(socketId) {
        this.socketToPlayer.delete(socketId);
    }
    getPlayerBySocket(socketId) {
        return this.socketToPlayer.get(socketId);
    }
}
export const globalRoomStore = new InMemoryRoomStore();
//# sourceMappingURL=room-store.js.map