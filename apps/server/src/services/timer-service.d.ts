import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData, InternalRoom } from "@impostor/shared";
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export declare class TimerService {
    private static timers;
    static startTimer(io: TypedServer, room: InternalRoom, type: "clue" | "discussion" | "vote", durationSeconds: number, onExpire: () => void): void;
    static clearTimer(roomCode: string): void;
    static broadcastRoomUpdates(io: TypedServer, room: InternalRoom): void;
}
export {};
//# sourceMappingURL=timer-service.d.ts.map