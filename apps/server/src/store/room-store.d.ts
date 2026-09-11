import { InternalRoom, RoomSettings, Player, RoomSummary } from "@impostor/shared";
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
export declare class InMemoryRoomStore implements RoomStore {
    private roomsById;
    private roomsByCode;
    private socketToPlayer;
    generateRoomCode(): string;
    createRoom(hostPlayer: Player, settings: RoomSettings, passwordHash?: string): InternalRoom;
    getRoomByCode(code: string): InternalRoom | undefined;
    getRoomById(id: string): InternalRoom | undefined;
    deleteRoom(id: string): boolean;
    listPublicRooms(): RoomSummary[];
    createSessionToken(playerId: string, roomCode: string): string;
    verifySessionToken(token: string, playerId: string, roomCode: string): boolean;
    getRoomCount(): number;
    registerSocket(socketId: string, playerId: string, roomCode: string): void;
    unregisterSocket(socketId: string): void;
    getPlayerBySocket(socketId: string): {
        playerId: string;
        roomCode: string;
    } | undefined;
}
export declare const globalRoomStore: InMemoryRoomStore;
//# sourceMappingURL=room-store.d.ts.map